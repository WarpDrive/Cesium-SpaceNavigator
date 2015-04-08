
/* HyperSonic's Cesium 3DMouse plugin (dependencies: PI_manager.js, PI_common.js, PI_math.js)
scheme is a movement type, there are currently 4 types: 'sixDofTrue', 'sixDofCurved', 'fiveDof', 'fiveDofCamUp'
Hyper.SpaceNav.spaceCon.push('sixDofTrue','fiveDof');
*/
Hyper.SpaceNav = function(){};
Hyper.SpaceNav.init = function(){};
Hyper.SpaceNav.inertia5dof=[0,0,0,0,0,0];//x,y,z,Rx,Ry,Rz
Hyper.SpaceNav.inertia6dof=[0,0,0,0,0,0];//x,y,z,Rx,Ry,Rz
Hyper.SpaceNav.spaceCon=[];//parallel with Hyper.input.controllers

//declare/define utility functions
Hyper.SpaceNav.getWishSpeed = function(mp,moveScale)
{
	var camera = viewer.scene.camera;
	var wishspeed =
	[
		mp[0]*0.02*camera.frustum.fov*moveScale,
		mp[1]*0.02*camera.frustum.fov*moveScale,
		mp[2]*0.02*camera.frustum.fov*moveScale,
		mp[3]*0.02*camera.frustum.fov,
		mp[4]*0.02*2,
		mp[5]*0.02*camera.frustum.fov
	];
	return wishspeed;
}
Hyper.SpaceNav.getResultSpeed = function(controller,wishspeed)
{
	var con=Hyper.input.controllers;
	var camera = viewer.scene.camera;var smoothfactor;
	var ep=0.000001;
	var veryclose,dif;
	var resultSpeed=wishspeed.slice(); //clone
	//DON'T init resultSpeed to all zeros, it will handle pauses badly!

	//smooth (for now it assumes 16ms frametime)
	i=0;while(i<6)
	{			
		if(Hyper.SpaceNav.spaceCon[controller]=="fiveDof"){dif = wishspeed[i]-Hyper.SpaceNav.inertia5dof[i];}
		if(Hyper.SpaceNav.spaceCon[controller]=="sixDofTrue"){dif = wishspeed[i]-Hyper.SpaceNav.inertia6dof[i];}		
		if(i<3){veryclose=ep;} //translations
		else{veryclose=ep;} //looking
		if(Math.abs(dif)>veryclose)
		{
			if(i<3){smoothfactor=0.08;} //translations
			else{smoothfactor=0.08;} //looking
			if(Hyper.SpaceNav.spaceCon[controller]=="fiveDof"){resultSpeed[i] = Hyper.SpaceNav.inertia5dof[i] + dif * smoothfactor;}
			if(Hyper.SpaceNav.spaceCon[controller]=="sixDofTrue"){resultSpeed[i] = Hyper.SpaceNav.inertia6dof[i] + dif * smoothfactor;}
		}
		if(Hyper.SpaceNav.spaceCon[controller]=="fiveDof"){Hyper.SpaceNav.inertia5dof[i] = resultSpeed[i];i+=1;}
		if(Hyper.SpaceNav.spaceCon[controller]=="sixDofTrue"){Hyper.SpaceNav.inertia6dof[i] = resultSpeed[i];i+=1;}
	}
	return resultSpeed;
}
Hyper.SpaceNav.lookThreeDof = function(speeds)
{
	var camera = viewer.scene.camera;
	camera.look(camera.right,speeds[0]);
	camera.look(camera.direction,speeds[1]);
	camera.look(camera.up,speeds[2]);
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
	var GD_ENU_U = Cesium.Matrix3.getColumn(rotmat,2,new CC3());
	lookThreeDof([speeds[3],speeds[4],speeds[5]]); //look
	
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
	if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hasMagnitude(rotateVec)){}
	else{camera.rotate(rotateVec,ang);}
}
Hyper.SpaceNav.move5DOF = function(speeds,rotmat,radius,camUp)
{
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;var hm3=Hyper.math3D;
	var GD_ENU_U = Cesium.Matrix3.getColumn(rotmat,2,new CC3());
	
	Hyper.SpaceNav.lookTwoDof([speeds[3],speeds[4],speeds[5]],GD_ENU_U); //look & fov_zoom
	
	//var levelRight = CC3.cross(camera.direction,GD_ENU_U,new CC3());	//ignores roll
	//var levelUp = CC3.cross(levelRight,camera.direction,new CC3());	//ignores roll
	
	if(camUp)
	{
		//calcs
		var rightC = hm3.scaleVector(speeds[0],camera.right);
		var dirC = hm3.scaleVector(speeds[1],camera.direction);
		var upC = hm3.scaleVector(speeds[2],camera.up);
		var moveVec = hm3.addVectors([rightC,dirC,upC]);
		var vertMag = CC3.dot(moveVec,GD_ENU_U,new CC3());
		var vertVec = hm3.scaleVector(vertMag,GD_ENU_U);
		var horzVec = CC3.subtract(moveVec,vertVec,new CC3());
		var horzMag = CC3.magnitude(horzVec,new CC3());
		var rotateVec = CC3.cross(horzVec,GD_ENU_U,new CC3());
		var circum=2*Math.PI*radius;
		var ang=(horzMag/circum)*(2*Math.PI);
		
		//moves
		if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hasMagnitude(rotateVec)){}
		else{camera.rotate(rotateVec,ang);}
		camera.move(GD_ENU_U,vertMag); //alter radius at the end (since speeds are based on original radius)
	}
	else//world up
	{
		//remove camDir vertical component (don't need to with right vec if roll is 0)
		//another way is just do cross(up,right)
		var camDir=hm3.vectorToTransform(camera.direction,rotmat);
		camDir.z=0;camDir=hm3.vectorUnitize(camDir);
		camDir = hm3.vectorFromTransform(camDir,rotmat);
		
		//calcs
		var rightC = hm3.scaleVector(speeds[0],camera.right);
		var dirC = hm3.scaleVector(speeds[1],camDir);
		var horzVec = hm3.addVectors([rightC,dirC]);
		var horzMag = CC3.magnitude(horzVec,new CC3());
		var rotateVec = CC3.cross(horzVec,GD_ENU_U,new CC3());
		var circum=2*Math.PI*radius;
		var ang=(horzMag/circum)*(2*Math.PI);

		//moves
		if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hm3.hasMagnitude(rotateVec)){}
		else{camera.rotate(rotateVec,ang);}		
		var reverse = 1;
		if(Math.abs(Hyper.common.mycam.rol)>Math.PI/2){reverse=-1;}
		camera.move(GD_ENU_U,speeds[2]*reverse); //alter radius at the end (since speeds are based on original radius)
	}
}
Hyper.SpaceNav.cameraHPR = function(comparedTO)
{
	//comparedTo is usually the local ENU in terms of world coordinates
	//cam_matrix are the camera vectors in terms of world coordinates
	var camera = viewer.scene.camera;var hm3=Hyper.math3D;
	var cam_matrix = hm3.vectorsToMatrix(camera.right,camera.direction,camera.up);
	var Lcam_matrix = hm3.matrixToTransform(cam_matrix,comparedTO);	//cam_matrix 'in terms of' comparedTO
	var temp = hm3.matrixToHPR(Lcam_matrix);
	Hyper.common.mycam.hea=temp[0];Hyper.common.mycam.pit=temp[1];Hyper.common.mycam.rol=temp[2];
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

	//Moon
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
	if((camera._mode == 1)||(camera._mode == 2)){dist=camera.position.z;}	//doesn't appear to show moon on these modes
	dist=Math.abs(dist);	//don't care which side of the surface
	if(dist<16){dist=16;}	//treat 0 to 16 meters the same so you don't slow to a crawl
	
	return dist;
}
Hyper.SpaceNav.main = function(clock)
{
	//Cesium abbreviations
	var camera = viewer.camera;var cp = camera.position;var hc=Hyper.common;
	var con=Hyper.input.controllers;
	
	//Set camera HPR
	//TODO: better way to determine upsideDown using local right.z up.z ?
	var prevUpsideDown=0;if(Math.abs(hc.mycam.rol)>Math.PI/2){prevUpsideDown=1;}
	Hyper.SpaceNav.cameraHPR(hc.GD_rotmat);
						
	//adjust camera
	var myinput,wishSpeed,resultSpeed;
	var dist = Hyper.SpaceNav.getDist();
	var i=0;while(i<con.length)
	{
		myinput=Hyper.input.getInput(i);
		wishSpeed=Hyper.SpaceNav.getWishSpeed(myinput,dist);
		resultSpeed=Hyper.SpaceNav.getResultSpeed(i,wishSpeed);
		
		/* Schemes to add
			-Tranforms other than Earth fixed, such as:
				-ICRF so you can move like a satellite does
				-around a satellite which in turn is moving in ICRF (become an astronaut repairing the ISS!)
		*/
		if(Hyper.SpaceNav.spaceCon[i]=="sixDofTrue"){Hyper.SpaceNav.moveSixDofTrue(resultSpeed);}
		if(Hyper.SpaceNav.spaceCon[i]=="sixDofCurved"){Hyper.SpaceNav.moveSixDofCurved(resultSpeed,hc.GD_rotmat,hc.GC_carto.rad);}
		if(Hyper.SpaceNav.spaceCon[i]=="fiveDofCamUp" || Hyper.SpaceNav.spaceCon[i]=="fiveDof")
		{
			if((wishSpeed[3]!=0)||(wishSpeed[5]!=0))
			{
				if(Math.abs(hc.mycam.rol)<Math.PI/2) //positive tilt
				{
					if(hc.mycam.rol!=0){camera.look(camera.direction,hc.mycam.rol);}	//set roll 0
					Hyper.SpaceNav.cameraHPR(hc.GD_rotmat); //refresh rol
				}
				else //negative tilt
				{
					if(Math.abs(hc.mycam.rol)!=180){camera.look(camera.direction,-(Math.PI-hc.mycam.rol));}	//set roll 180
					Hyper.SpaceNav.cameraHPR(hc.GD_rotmat); //refresh rol
				}
			}
			var nowUpsideDown=0;if(Math.abs(hc.mycam.rol)>Math.PI/2){nowUpsideDown=1;}
			if(nowUpsideDown!=prevUpsideDown)
			{
				var list=[2];//used to be more axis
				var j=0;while(j<list.length)
				{
					if(Hyper.SpaceNav.spaceCon[i]=="fiveDof"){Hyper.SpaceNav.inertia5dof[list[j]]*=-1;}
					if(Hyper.SpaceNav.spaceCon[i]=="sixDofTrue"){Hyper.SpaceNav.inertia6dof[list[j]]*=-1;}
					j+=1;
				}
			}
			if(Hyper.SpaceNav.spaceCon[i]=="fiveDofCamUp"){Hyper.SpaceNav.move5DOF(resultSpeed,hc.GD_rotmat,hc.GC_carto.rad,true);}
			if(Hyper.SpaceNav.spaceCon[i]=="fiveDof"){Hyper.SpaceNav.move5DOF(resultSpeed,hc.GD_rotmat,hc.GC_carto.rad,false);}
			//adjust fov
			camera.frustum.fov+= resultSpeed[4]/2; //FOV adjust since no roll
			if(camera.frustum.fov<0.0000000001) {camera.frustum.fov=0.0000000001;}
			if(camera.frustum.fov>=(Math.PI-0.001)) {camera.frustum.fov=Math.PI-0.001;}
		}
		i+=1;
	}
}