#!/usr/bin/env python3
"""V2: rig and reweight the original humanoid from user-marked screenshot joints.
Only bone translations, inverse bind matrices, JOINTS_0, WEIGHTS_0, and metadata
change. Mesh positions, indices, normals, UVs, texture, and joint names stay.
"""
import json, struct, hashlib
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

P=Path('objects/anatomical-woman-rig/assets/character-rigged.glb')
BONES=[
 ('Hips',None,(0,.145,-.022)),('Spine','Hips',(0,.293,-.025)),
 ('Spine1','Spine',(0,.456,-.025)),('Chest','Spine1',(0,.581,-.027)),
 ('Neck','Chest',(0,.665,-.024)),('Head','Neck',(0,.748,-.017)),
 ('LeftShoulder','Chest',(-.135,.583,-.026)),
 ('LeftUpperArm','LeftShoulder',(-.174,.573,-.020)),
 ('LeftLowerArm','LeftUpperArm',(-.262,.283,-.015)),
 ('LeftHand','LeftLowerArm',(-.374,.026,-.006)),
 ('RightShoulder','Chest',(.139,.583,-.026)),
 ('RightUpperArm','RightShoulder',(.178,.569,-.020)),
 ('RightLowerArm','RightUpperArm',(.259,.281,-.015)),
 ('RightHand','RightLowerArm',(.369,.026,-.006)),
 ('LeftUpperLeg','Hips',(-.129,.020,-.020)),
 ('LeftLowerLeg','LeftUpperLeg',(-.091,-.408,-.038)),
 ('LeftFoot','LeftLowerLeg',(-.075,-.808,-.036)),
 ('LeftToes','LeftFoot',(-.075,-.952,.090)),
 ('RightUpperLeg','Hips',(.135,.020,-.020)),
 ('RightLowerLeg','RightUpperLeg',(.094,-.409,-.038)),
 ('RightFoot','RightLowerLeg',(.077,-.809,-.036)),
 ('RightToes','RightFoot',(.077,-.952,.090))
]
ids={name:i for i,(name,_,_) in enumerate(BONES)}
def smooth(a,b,v):
 t=np.clip((v-a)/(b-a),0,1)
 return t*t*(3-2*t)
raw=P.read_bytes()
assert struct.unpack_from('<III',raw,0)==(0x46546c67,2,len(raw))
jl,jt=struct.unpack_from('<II',raw,12);assert jt==0x4e4f534a
data=json.loads(raw[20:20+jl])
binstart=20+jl+8;bl,bt=struct.unpack_from('<II',raw,20+jl)
assert bt==0x004e4942 and binstart+bl==len(raw)
binary=bytearray(raw[binstart:])
skin=data['skins'][0]
assert len(skin['joints'])==22
assert [data['nodes'][n]['name'] for n in skin['joints']]==[n for n,_,_ in BONES]
def access(i):
 a=data['accessors'][i];v=data['bufferViews'][a['bufferView']]
 dt={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']]
 n={'VEC3':3,'VEC4':4,'MAT4':16,'SCALAR':1,'VEC2':2}[a['type']]
 return np.frombuffer(binary,dtype=dt,count=a['count']*n,
   offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],n)
pattrs=data['meshes'][0]['primitives'][0]['attributes']
pos=access(pattrs['POSITION']).copy()
normals=access(pattrs['NORMAL']).copy()
uv=access(pattrs['TEXCOORD_0']).copy()
xyz=pos.astype(np.float64)
x,y,z=xyz.T
ax=np.abs(x)
N=len(pos);w=np.zeros((N,22),np.float64)
indices=access(data['meshes'][0]['primitives'][0]['indices']).reshape(-1,3)
edges=np.concatenate((indices[:,[0,1]],indices[:,[1,2]],indices[:,[2,0]]))
ij=np.concatenate((edges,edges[:,::-1]))
adj=coo_matrix((np.ones(len(ij),np.uint8),(ij[:,0],ij[:,1])),
 shape=(N,N)).tocsr()
num,labels=connected_components(adj,directed=False)
# Morphologically separate upper arms from torso: protect forward (+Z) breast.
threshold=np.interp(y,[-.16,-.09,.02,.17,.29,.42,.53,.58,.65],
 [.291,.283,.273,.232,.191,.180,.177,.155,.190])
threshold+=.072*smooth(.04,.135,z)
arm=smooth(threshold-.023,threshold+.023,ax)
arm*=smooth(-.175,-.115,y)*(1-smooth(.607,.657,y))
leg=(1-smooth(-.092,.101,y))*smooth(.018,.082,ax)
leg=np.maximum(leg,(1-smooth(-.180,-.119,y))*.995)
leg*=1-arm
core=np.maximum(0,1-arm-leg)
# Axial spine transitions centered on marked sternum, collar, neck and skull.
knots=[(.20,.28),(.345,.415),(.470,.535),(.599,.676),(.693,.738)]
fade=np.stack([smooth(a,b,y) for a,b in knots],axis=1)
axial=np.zeros((N,6),np.float64)
axial[:,0]=1-fade[:,0]
for i in range(1,5):axial[:,i]=fade[:,i-1]*(1-fade[:,i])
axial[:,5]=fade[:,4]
w[:,:6]=core[:,None]*axial
# Keep disconnected hair/face surface pieces moving with the head as a whole.
count=np.bincount(labels)
meany=np.bincount(labels,weights=y)/np.maximum(1,count)
miny=np.full(num,np.inf);np.minimum.at(miny,labels,y)
hair=(meany[labels]>.77)&(miny[labels]>.677)
w[hair,:]=0;w[hair,ids['Head']]=1
for side,sign in [('Left',-1),('Right',1)]:
 portion=smooth(-.010,.010,sign*x)
 a=arm*portion
 upper=smooth(.229,.334,y)
 hand=1-smooth(-.013,.068,y)
 shoulder=np.clip(.33*smooth(.510,.590,y)*(1-smooth(.160,.240,ax)),0,.4)
 w[:,ids[side+'Shoulder']]+=a*upper*shoulder
 w[:,ids[side+'UpperArm']]+=a*upper*(1-shoulder)
 w[:,ids[side+'LowerArm']]+=a*(1-upper)*(1-hand)
 w[:,ids[side+'Hand']]+=a*(1-upper)*hand
 g=leg*portion
 thigh=smooth(-.456,-.363,y)
 ankle=1-smooth(-.860,-.764,y)
 toe=ankle*(1-smooth(-.958,-.888,y))*smooth(.030,.115,z)
 w[:,ids[side+'UpperLeg']]+=g*thigh
 w[:,ids[side+'LowerLeg']]+=g*(1-thigh)*(1-ankle)
 w[:,ids[side+'Foot']]+=g*(1-thigh)*ankle*(1-toe)
 w[:,ids[side+'Toes']]+=g*(1-thigh)*ankle*toe
total=w.sum(axis=1)
assert (total>1e-6).all()
w/=total[:,None]
idx=np.argpartition(w,-4,axis=1)[:,-4:]
weight=np.take_along_axis(w,idx,axis=1)
order=np.argsort(-weight,axis=1)
joints=np.take_along_axis(idx,order,axis=1).astype('<u2')
weight=np.take_along_axis(weight,order,axis=1)
weight=(weight/weight.sum(axis=1,keepdims=True)).astype('<f4')
assert np.all(np.isfinite(weight)) and np.allclose(weight.sum(1),1,atol=2e-6)
assert joints.max()<22
access(pattrs['JOINTS_0'])[:]=joints
access(pattrs['WEIGHTS_0'])[:]=weight
ab={n:np.array(p,np.float64) for n,_,p in BONES}
for i,(n,parent,p) in enumerate(BONES):
 node=data['nodes'][skin['joints'][i]]
 local=ab[n]-ab[parent] if parent else ab[n]
 node['translation']=[float(q) for q in local]
ibm=access(skin['inverseBindMatrices'])
for i,(n,parent,p) in enumerate(BONES):
 m=np.eye(4,dtype='<f4');m[:3,3]=-np.array(p,dtype='<f4')
 ibm[i]=m.T.reshape(16)
skin['name']='HumanRig_UserMarkedPivots_Reweighted_v2'
data.setdefault('extras',{}).update({
 'skinWeightsVersion':2,
 'rigQuality':'User-marked pivots, geometrically segmented four-influence weighting. Anatomical approximation only.',
 'referenceJointImage':'Screenshot 2026-11-04 at 22.07.54.jpg',
 'jointReference':'Forehead/crown marker represents head bone tip, not rotation center'
})
assert np.array_equal(pos,access(pattrs['POSITION']))
assert np.array_equal(normals,access(pattrs['NORMAL']))
assert np.array_equal(uv,access(pattrs['TEXCOORD_0']))
# New binary differs only in inverse bind matrices and skin weights and joint IDs.
js=json.dumps(data,separators=(',',':'),ensure_ascii=False).encode('utf-8')
js+=b' '*((-len(js))%4)
binary.extend(b'\x00'*((-len(binary))%4))
data_size=12+8+len(js)+8+len(binary)
out=(struct.pack('<III',0x46546c67,2,data_size)
 +struct.pack('<II',len(js),0x4e4f534a)+js
 +struct.pack('<II',len(binary),0x004e4942)+binary)
assert len(out)==data_size
P.write_bytes(out)
print('Updated',P,'bytes',len(out),'verts',N,'joints',22)
print('SHA256',hashlib.sha256(out).hexdigest())
print('Weight normalization',float(weight.sum(1).min()),float(weight.sum(1).max()))
