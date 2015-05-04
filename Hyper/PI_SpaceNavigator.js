
/* HyperSonic's Cesium 3DMouse plugin (dependencies: PI_manager.js, PI_common.js, PI_math.js, PI_input.js)
spaceCon is a movement type, there are currently 4 types: 'sixDofTrue', 'sixDofCurved', 'fiveDof', 'fiveDofCamUp'

TODO Schemes to add
	-Tranforms other than Earth fixed, such as:
		-ICRF so you can move like a satellite does
		-around a satellite which in turn is moving in ICRF (become an astronaut repairing the ISS!)
*/
Hyper.SpaceNav = function(){};
Hyper.SpaceNav.moveTypes=['fiveDof','fiveDofCamUp','sixDofTrue','sixDofCurved'];
Hyper.SpaceNav.keyboardCon=0;
Hyper.SpaceNav.spaceCon=[];//parallel array with Hyper.input.controllers
Hyper.SpaceNav.inertia5dof=[0,0,0,0,0,0];//x,y,z,Rx,Ry,Rz
Hyper.SpaceNav.inertia5dofCamUp=[0,0,0,0,0,0];//x,y,z,Rx,Ry,Rz
Hyper.SpaceNav.inertia6dof=[0,0,0,0,0,0];//x,y,z,Rx,Ry,Rz
Hyper.SpaceNav.inertia6dofCurved=[0,0,0,0,0,0];//x,y,z,Rx,Ry,Rz
//Hyper.SpaceNav.smoothFactor=[0.08,0.08];//trans,rots
//Hyper.SpaceNav.smoothFactorKeys=[0.08,0.08];//trans,rots
Hyper.SpaceNav.baseTranSpeed=0.02;
Hyper.SpaceNav.baseRotSpeed=0.02;
Hyper.SpaceNav.init = function()
{
	Hyper.SpaceNav.spaceCon.push('fiveDof','sixDofTrue');//default
	viewer.scene.screenSpaceCameraController.minimumZoomDistance=2;//any lower and there's visual clipping issues
}
	/*
Hyper.SpaceNav.getSmoothFactor = function(i)
{
	var hs=Hyper.SpaceNav;
	if(i==999)//keyboard
	{return hs.smoothFactorKeys.slice();}
	else{return hs.smoothFactor.slice();}

	return [0.08,0.08];
}
	*/
Hyper.SpaceNav.getMoveType = function(i)
{
	var hs=Hyper.SpaceNav;
	var answer;
	if(i==999)//keyboard
	{answer=hs.moveTypes[hs.keyboardCon];}
	else{answer=hs.spaceCon[i];}
	return answer;
}
Hyper.SpaceNav.getInputs = function(i)
{
	var hi=Hyper.input;var hs=Hyper.SpaceNav;
	var myinput=[0,0,0,0,0,0];
	if(i==999)//keyboard
	{
		var j=0;while(j<hi.keysDown.length)
		{
			if(hi.keysDown[j]==83){myinput[0]=-1;}//s-moveleft
			if(hi.keysDown[j]==70){myinput[0]=1;}//f-moveright
			if(hi.keysDown[j]==69){myinput[1]=1;}//e-forward
			if(hi.keysDown[j]==68){myinput[1]=-1;}//d-backward
			if(hi.keysDown[j]==65){myinput[2]=1;}//a-moveup
			if(hi.keysDown[j]==90){myinput[2]=-1;}//z-movedown
			if(hi.keysDown[j]==73){myinput[3]=-1;}//i-pitchup
			if(hi.keysDown[j]==75){myinput[3]=1;}//k-pitchdown
			if(hi.keysDown[j]==85){myinput[4]=1;}//u-rollleft
			if(hi.keysDown[j]==79){myinput[4]=-1;}//o-rollright
			if(hi.keysDown[j]==74){myinput[5]=-1;}//j-yawleft
			if(hi.keysDown[j]==76){myinput[5]=1;}//k-yawright
			j+=1;
		}
	}
	else{myinput=Hyper.input.getInput(i);}
	return myinput;//clone?
}

Hyper.SpaceNav.getWishSpeed = function(mp,moveScale)
{
	var hsb=Hyper.SpaceNav.baseTranSpeed;
	var fov = viewer.scene.camera.frustum.fov;
	var wishspeed =
	[
		mp[0]*hsb*fov*moveScale,
		mp[1]*hsb*fov*moveScale,
		mp[2]*hsb*fov*moveScale,
		mp[3]*hsb*fov,
		mp[4]*hsb*2,
		mp[5]*hsb*fov
	];
	return wishspeed;
}
Hyper.SpaceNav.getResultSpeed = function(moveType,wishspeed)
{
	var hs=Hyper.SpaceNav;
	//var sc=Hyper.SpaceNav.spaceCon[controller];
	var camera = viewer.scene.camera;
	var ep=0.000001;
	var smoothfactor=[0.08,0.08];
	var veryclose,dif,sm;
	var resultSpeed=wishspeed.slice(); //clone
	//DON'T init resultSpeed to all zeros, it will handle pauses badly!
	
	//smooth
	var i=0;while(i<6)
	{			
		//get dif
		if(moveType=="fiveDof"){dif = wishspeed[i]-hs.inertia5dof[i];}
		if(moveType=="fiveDofCamUp"){dif = wishspeed[i]-hs.inertia5dofCamUp[i];}
		if(moveType=="sixDofTrue"){dif = wishspeed[i]-hs.inertia6dof[i];}	
		if(moveType=="sixDofCurved"){dif = wishspeed[i]-hs.inertia6dofCurved[i];}	
		if(i<3){veryclose=ep;} //translations
		else{veryclose=ep;} //looking
		if(Math.abs(dif)>veryclose) //only smooth if there's a significant difference
		{
			//apply smoothing (tweaked for 16ms frametime, should factor in the real frametime)
			if(i<3){sm=smoothfactor[0];}else{sm=smoothfactor[1];}//extract tran or rot
	
		if(moveType=="fiveDof"){resultSpeed[i] = hs.inertia5dof[i] + dif * sm;}
		if(moveType=="fiveDofCamUp"){resultSpeed[i] = hs.inertia5dofCamUp[i] + dif * sm;}
		if(moveType=="sixDofTrue"){resultSpeed[i] = hs.inertia6dof[i] + dif * sm;}	
		if(moveType=="sixDofCurved"){resultSpeed[i] = hs.inertia6dofCurved[i] + dif * sm;}
		}
		//save inertia for next frame
		if(moveType=="fiveDof"){hs.inertia5dof[i] = resultSpeed[i];}
		if(moveType=="fiveDofCamUp"){hs.inertia5dofCamUp[i] = resultSpeed[i];}
		if(moveType=="sixDofTrue"){hs.inertia6dof[i] = resultSpeed[i];}
		if(moveType=="sixDofCurved"){hs.inertia6dofCurved[i] = resultSpeed[i];}
		i+=1;
	}
	return resultSpeed;
}
Hyper.SpaceNav.lookThreeDof = function(speeds)
{
	var camera = viewer.scene.camera;
	camera.look(camera.right,speeds[0]);
	camera.look(camera.direction,speeds[1]);
	camera.look(camera.up,speeds[2]);
	//TODO pitch and yaw could be combined into one movement
}
Hyper.SpaceNav.lookTwoDof = function(speeds,GD_ENU_U)
{
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;
	var pitchAxis = CC3.cross(camera.direction,GD_ENU_U,new CC3());
	var reverse=1;if(Math.abs(Hyper.common.mycam.rol)>Math.PI/2){reverse=-1;}
	camera.look(pitchAxis, speeds[0]*reverse); //pitch
	camera.look(GD_ENU_U, speeds[2]*reverse);	//yaw	
}
Hyper.SpaceNav.moveSixDofTrue = function(speeds)
{	
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;
	var hm3=Hyper.math3D;
	//calcs
	if(1)
	{
		camera.move(camera.right,speeds[0]);
		camera.move(camera.direction,speeds[1]);
		camera.move(camera.up,speeds[2]);
	}
	else //ideally movement smoothing should be on the resultant not component vectors
	{
		var rightC = hm3.scaleVector(speeds[0],camera.right);
		var dirC = hm3.scaleVector(speeds[1],camera.direction);
		var upC = hm3.scaleVector(speeds[2],camera.up);
		var moveVec = hm3.addVectors([rightC,dirC,upC]);
		var moveMag = CC3.magnitude(moveVec);
		moveVec = hm3.vectorUnitize(moveVec);
		camera.move(moveVec,moveMag); //move
	}
	Hyper.SpaceNav.lookThreeDof([speeds[3],speeds[4],speeds[5]]); //look
}
Hyper.SpaceNav.moveSixDofCurved = function(speeds,rotmat,radius)
{
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;var hm3=Hyper.math3D;
	
	var GD_ENU_U = new CC3();
	if((viewer.scene.mode==1)||(viewer.scene.mode==2)){GD_ENU_U = new CC3(0,0,1);} //Columbus and 2D
	else{GD_ENU_U = Cesium.Matrix3.getColumn(rotmat,2,new CC3());}
		
	Hyper.SpaceNav.lookThreeDof([speeds[3],speeds[4],speeds[5]]); //look
	
	//calcs
	var rightC = hm3.scaleVector(speeds[0],camera.right);
	var dirC = hm3.scaleVector(speeds[1],camera.direction);
	var upC = hm3.scaleVector(speeds[2],camera.up);
	var moveVec = hm3.addVectors([rightC,dirC,upC]);
	var vertMag = CC3.dot(moveVec,GD_ENU_U,new CC3());

	camera.move(GD_ENU_U,vertMag); //move vertical

	//move horizontal along a great circle
	var vertVec = hm3.scaleVector(vertMag,GD_ENU_U);
	var horzVec = CC3.subtract(moveVec,vertVec,new CC3());
	var horzMag = CC3.magnitude(horzVec,new CC3());
	var rotateVec = CC3.cross(horzVec,GD_ENU_U,new CC3());
	var circum=2*Math.PI*radius;
	var ang=(horzMag/circum)*(2*Math.PI);
	if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hm3.hasMagnitude(rotateVec)){}
	else{camera.rotate(rotateVec,ang);}
}
Hyper.SpaceNav.move5DOF = function(speeds,rotmat,radius,camUp)
{
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;var hm3=Hyper.math3D;
	var GD_ENU_U = new CC3();
	
	if((viewer.scene.mode==1)||(viewer.scene.mode==2)){GD_ENU_U = new CC3(0,0,1);} //Columbus and 2D
	else{GD_ENU_U = Cesium.Matrix3.getColumn(rotmat,2,new CC3());}
		
	Hyper.SpaceNav.lookTwoDof([speeds[3],speeds[4],speeds[5]],GD_ENU_U); //look & fov_zoom
	var reverse = 1;
	if(Math.abs(Hyper.common.mycam.rol)>Math.PI/2){reverse=-1;}
	
	//var levelRight = CC3.cross(camera.direction,GD_ENU_U,new CC3());	//ignores roll
	//var levelUp = CC3.cross(levelRight,camera.direction,new CC3());	//ignores roll
	
	if(camUp)
	{
		//calcs (for all scene modes)
		var rightC = hm3.scaleVector(speeds[0],camera.right);
		var dirC = hm3.scaleVector(speeds[1],camera.direction);
		var upC = hm3.scaleVector(speeds[2],camera.up);
		var moveVec = hm3.addVectors([rightC,dirC,upC]);
		var moveMag = CC3.magnitude(moveVec,new CC3());

		if((viewer.scene.mode==1)||(viewer.scene.mode==2))//Columbus & 2D
		{
			//move
			camera.move(hm3.vectorUnitize(moveVec),moveMag);
		}
		else//3D
		{
			//calcs for 3D
			var vertMag = CC3.dot(moveVec,GD_ENU_U,new CC3());
			var vertVec = hm3.scaleVector(vertMag,GD_ENU_U);
			var horzVec = CC3.subtract(moveVec,vertVec,new CC3());
			var horzMag = CC3.magnitude(horzVec,new CC3());
			var rotateVec = CC3.cross(horzVec,GD_ENU_U,new CC3());
			var circum=2*Math.PI*radius;
			var ang=(horzMag/circum)*(2*Math.PI);
			
			//move
			if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hm3.hasMagnitude(rotateVec)){}
			else{camera.rotate(rotateVec,ang);} //great circle
			camera.move(GD_ENU_U,vertMag); //alter radius at the end (since speeds are based on original radius)
		}
	}
	else//world up
	{
		//remove camDir vertical component (don't need to with right vec if roll is 0)
		//another way is just do cross(up,right)
		
		//calc camDir
		var camDir=new CC3();
		if((viewer.scene.mode==1)||(viewer.scene.mode==2)) //Columbus & 2D
		{
			camDir=camera.direction.clone();camDir.z=0;
			//TODO incase there is roll, maybe do camRig and set camRig.z=0
		}
		else//3D
		{
			/*
			//remove vertical component from camera.direction
			var CC3=Cesium.Cartesian3;
			var nadir = new CC3();var temp= new CC3();
			Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(currentPos, nadir);
			CC3.negate(nadir,nadir); //zenith to nadir
			var scalar = CC3.dot(camera.direction,nadir);
			CC3.multiplyByScalar(nadir,scalar,temp);
			CC3.subtract(camera.direction,temp,temp); //remove downward component
			*/
			camDir=hm3.vectorToTransform(camera.direction,rotmat);
			camDir.z=0;camDir=hm3.vectorUnitize(camDir);
			camDir = hm3.vectorFromTransform(camDir,rotmat);
		}
		//calcs horizontal (for all scene modes)
		var rightC = hm3.scaleVector(speeds[0],camera.right);
		var dirC = hm3.scaleVector(speeds[1],camDir);
		var horzVec = hm3.addVectors([rightC,dirC]);
		var horzMag = CC3.magnitude(horzVec,new CC3());

		if((viewer.scene.mode==1)||(viewer.scene.mode==2)) //Columbus & 2D
		{
			camera.move(hm3.vectorUnitize(horzVec),horzMag);
			camera.move(GD_ENU_U,speeds[2]*reverse);
		}
		else //3D
		{
			var rotateVec = CC3.cross(horzVec,GD_ENU_U,new CC3());
			var circum=2*Math.PI*radius;
			var ang=(horzMag/circum)*(2*Math.PI);

			//moves
			if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hm3.hasMagnitude(rotateVec)){}
			else{camera.rotate(rotateVec,ang);}		
			camera.move(GD_ENU_U,speeds[2]*reverse); //alter radius at the end (since speeds are based on original radius)
		}
	}
}
Hyper.SpaceNav.getDist = function()
{
	var camera = viewer.camera;var cp = camera.position;var hc=Hyper.common;
	var dist,mdist,sdist;var nearWhat;
			
	//Earth
	//camera._positionCartographic.height same as viewer.scene.globe.ellipsoid.cartesianToCartographic(cp).height
	var edist = camera._positionCartographic.height-hc.T_height;
	dist=edist;nearWhat="Earth";
	var temp;

	//Moon (only shows Moon in 3D mode)
	if(typeof hc.moonPositionEF != 'undefined') //if(Cesium.defined(hc.moonPositionEF))
	{
		temp = Math.pow(hc.moonPositionEF.x-cp.x,2) + Math.pow(hc.moonPositionEF.y-cp.y,2) + Math.pow(hc.moonPositionEF.z-cp.z,2);
		mdist = Math.sqrt(temp)-1737400; //cp distance from Moons's semi-minor axis
		if(edist>mdist){dist=mdist;nearWhat="Moon";}
	}	

	//Sun
	if(typeof hc.sunPositionEF != 'undefined') //if(Cesium.defined(hc.sunPositionEF))
	{
		temp = Math.pow(hc.sunPositionEF.x-cp.x,2) + Math.pow(hc.sunPositionEF.y-cp.y,2) + Math.pow(hc.sunPositionEF.z-cp.z,2);
		sdist = Math.sqrt(temp)-695800000; //cp distance from Sun's radius
		if(edist>sdist){dist=sdist;nearWhat="Sun";}
	}	

	//dist misc
	if((camera._mode == 1)||(camera._mode == 2)){dist=camera.position.z;} //TODO: what about terrain in Columbus mode?
	dist=Math.abs(dist);	//don't care which side of the surface
	if(dist<16){dist=16;}	//treat 0 to 16 meters the same so you don't slow to a crawl
	
	return dist;
}
Hyper.SpaceNav.arrayAdd = function(first,second)
{
	var result=[0,0,0,0,0,0];
	var i=0;while(i<first.length)
	{
		result[i]=first[i]+second[i];
		i+=1;
	}
	return result;
}
Hyper.SpaceNav.arrayNonZero = function(first)
{
	var nonZero=false;
	var i=0;while(i<first.length)
	{
		if(first[i]!=0){nonZero=true;break;}
		i+=1;
	}
	return nonZero;
}
Hyper.SpaceNav.main = function(clock)
{
	var hs=Hyper.SpaceNav;
	var fiveDofInput=[0,0,0,0,0,0];
	var fiveDofCamUpInput=[0,0,0,0,0,0];
	var sixDofTrueInput=[0,0,0,0,0,0];
	var sixDofCurvedInput=[0,0,0,0,0,0];
	var moveType;
	
	//3DMice input
	var i=0;while(i<Hyper.input.controllers.length)
	{
		moveType=hs.getMoveType(i);
		if(moveType=='fiveDof'){fiveDofInput=hs.arrayAdd(hs.getInputs(i),fiveDofInput);}
		if(moveType=='fiveDofCamUp'){fiveDofCamUpInput=hs.arrayAdd(hs.getInputs(i),fiveDofCamUpInput);}
		if(moveType=='sixDofTrue'){sixDofTrueInput=hs.arrayAdd(hs.getInputs(i),sixDofTrueInput);}
		if(moveType=='sixDofCurved'){sixDofCurvedInput=hs.arrayAdd(hs.getInputs(i),sixDofCurvedInput);}
		i+=1;
	}
			
	//keyboard input
	moveType=hs.getMoveType(999);	
	if(moveType=='fiveDof'){fiveDofInput=hs.arrayAdd(hs.getInputs(999),fiveDofInput);}
	if(moveType=='fiveDofCamUp'){fiveDofCamUpInput=hs.arrayAdd(hs.getInputs(999),fiveDofCamUpInput);}
	if(moveType=='sixDofTrue'){sixDofTrueInput=hs.arrayAdd(hs.getInputs(999),sixDofTrueInput);}
	if(moveType=='sixDofCurved'){sixDofCurvedInput=hs.arrayAdd(hs.getInputs(999),sixDofCurvedInput);}	
	
	//act on the input summations
	if(hs.arrayNonZero(fiveDofInput)||hs.arrayNonZero(hs.inertia5dof))
	{hs.move(fiveDofInput,'fiveDof');}
	if(hs.arrayNonZero(fiveDofCamUpInput)||hs.arrayNonZero(hs.inertia5dofCamUp))
	{hs.move(fiveDofCamUpInput,'fiveDofCamUp');}
	if(hs.arrayNonZero(sixDofTrueInput)||hs.arrayNonZero(hs.inertia6dof))
	{hs.move(sixDofTrueInput,'sixDofTrue');}
	if(hs.arrayNonZero(sixDofCurvedInput)||hs.arrayNonZero(hs.inertia6dofCurved))
	{hs.move(sixDofCurvedInput,'sixDofCurved');}
	
	//why does activating 3dmouse lower max keyboard result speed, but not wishspeed?
	//bcuz one is trying to set inertia to 0 while the other to 1
	//solution: maybe add wishspeeds together first, then plug that into resultspeeds
}
Hyper.SpaceNav.move = function(myinput,moveType)
{
	//abbreviations
	var hs=Hyper.SpaceNav;
	
	//get wish then result speed
	var wishSpeed=[0,0,0,0,0,0];
	var dist = hs.getDist();
	wishSpeed=hs.getWishSpeed(myinput,dist);	

	var resultSpeed=[0,0,0,0,0,0];	
	resultSpeed=hs.getResultSpeed(moveType,wishSpeed);
	
	if(moveType=="sixDofTrue" || moveType=="sixDofCurved"){Hyper.SpaceNav.moveSixDof(moveType,resultSpeed)}
	if(moveType=="fiveDofCamUp" || moveType=="fiveDof")
	{
		var turnAttempt=false;
		if((wishSpeed[3]!=0)||(wishSpeed[5]!=0)){turnAttempt=true;}
		Hyper.SpaceNav.moveFiveDof(moveType,resultSpeed,turnAttempt);
	}
}

Hyper.SpaceNav.moveSixDof = function(moveType,resultSpeed)
{
	var hc=Hyper.common;
	if(moveType=="sixDofTrue"){Hyper.SpaceNav.moveSixDofTrue(resultSpeed);}
	if(moveType=="sixDofCurved"){Hyper.SpaceNav.moveSixDofCurved(resultSpeed,hc.GD_rotmat,hc.GC_carto.rad);}
}
Hyper.SpaceNav.moveFiveDof = function(moveType,resultSpeed,turnAttempt)
{
	var hc=Hyper.common;var camera = viewer.camera;
	var hs=Hyper.SpaceNav;
	
	Hyper.common.cameraHPR(hc.GD_rotmat);
	var prevUpsideDown=0;if(Math.abs(hc.mycam.rol)>Math.PI/2){prevUpsideDown=1;}
	
	//only 5DOF turn attempts force level roll (play nice with 6DOF)
	if(turnAttempt==true)
	{
		if(Math.abs(hc.mycam.rol)<Math.PI/2) //positive tilt
		{
			if(hc.mycam.rol!=0){camera.look(camera.direction,hc.mycam.rol);}	//set roll 0
			hc.cameraHPR(hc.GD_rotmat); //refresh rol
		}
		else //negative tilt
		{
			if(Math.abs(hc.mycam.rol)!=180){camera.look(camera.direction,-(Math.PI-hc.mycam.rol));}	//set roll 180
			hc.cameraHPR(hc.GD_rotmat); //refresh rol
		}
	}
	
	//swap inertia when tilt sign changes
	var nowUpsideDown=0;if(Math.abs(hc.mycam.rol)>Math.PI/2){nowUpsideDown=1;}
	if(nowUpsideDown!=prevUpsideDown)
	{
		var list=[2];//used to be more axis
		var j=0;while(j<list.length)
		{
			if(moveType=="fiveDof"){hs.inertia5dof[list[j]]*=-1;}//not camUp			
			j+=1;
		}
	}
	if(moveType=="fiveDofCamUp"){Hyper.SpaceNav.move5DOF(resultSpeed,hc.GD_rotmat,hc.GC_carto.rad,true);}
	if(moveType=="fiveDof"){Hyper.SpaceNav.move5DOF(resultSpeed,hc.GD_rotmat,hc.GC_carto.rad,false);}
	
	if((viewer.scene.mode==1)||(viewer.scene.mode==3))//TODO 2D will be moving frustum walls
	{
		//adjust fov (using roll)
		var amount=Math.abs(resultSpeed[4]);
		var max=hs.baseRotSpeed*2;//from wishspeed function
		if(amount>(max*0.7)) //only activate on the last 30%
		{
			var sign=1;if(resultSpeed[4]<0){sign=-1;}
			amount=(amount-(max*0.7))*sign;
			camera.frustum.fov+= amount*camera.frustum.fov;
			if(camera.frustum.fov<(0.001/180*Math.PI)) {camera.frustum.fov=0.001/180*Math.PI;}
			if(camera.frustum.fov>(140/180*Math.PI)) {camera.frustum.fov=140/180*Math.PI;}
		}
	}
}