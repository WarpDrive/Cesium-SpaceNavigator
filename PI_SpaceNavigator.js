
/* HyperSonic's Cesium 3DMouse plugin (dependencies: PI_manager.js, PI_common.js, PI_math.js)

How to add controllers to the array:

controllers.push
({
	device:1,showRaw:false,maxInput:46,deadZones:[0.01,0.01,0.01,0.01,0.01,0.01],scheme:"sixDofTrue",
	cam_vel_prev:[0,0,0,0,0,0],scales:[1,-1,-1,-1,1,1]
});

controllers.push
({
	device:0,showRaw:false,maxInput:4,deadZones:[0.01,0.01,0.01,0.01,2,0.01],scheme:"fiveDofCamUp",
	cam_vel_prev:[0,0,0,0,0,0],scales:[1,-1,-1,-1,1,1]
});

Use controllers.pop() to remove a controller

device is array index of the GamePad API
showRaw:true displays raw input data in the console so you can figure out the maxInput of your device
deadZones are used to disable small inputs from registering, they are in terms of maxInput rather than -1 to +1
scheme is a movement type, there are currently 4 types: 'sixDofTrue', 'sixDofCurved', 'fiveDof', 'fiveDofCamUp'
cam_vel_prev is used for motion smoothing, just make sure it's an array of 6 numbers
scales can be used to scale and reverse the various axis

If you don't know device or maxInput set showRaw to true to figure it out by watching the console output (ctrl-shift-i)
Later I may provide automatic discovery by continuously scanning all of the gamepad api devices
*/

//declare globals for this plugin
var T_height=0;
var lastSampleTime; //only used if using alternative get height method

//declare/define utility functions
function getInput(controller)	//TODO: have keyboard input as an option for those without joysticks/3DMice/Gamepads
{	
	var mp = [0,0,0,0,0,0];var gp = navigator.getGamepads()[controllers[controller].device];
	if(!gp){return mp;}
	if(controllers[controller].showRaw==true){console.log(gp.axes);}
	i=0;while(i<gp.axes.length)
	{
		mp[i]=gp.axes[i];
		if(Math.abs(mp[i])<controllers[controller].deadZones[i]){mp[i]=0.0;} //deadzone TODO: once deadZone threshold is passed start output from zero
		mp[i]*=controllers[controller].scales[i]; //scale
		mp[i]/=controllers[controller].maxInput; //convert to -1 to +1 (GamePAD API is supposed to do this already)
		i+=1;
	}
	return mp;
}
function getWishSpeed(mp,moveScale)
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
function getResultSpeed(controller,wishspeed)
{
	var camera = viewer.scene.camera;var smoothfactor;
	var ep=0.000001;
	var resultSpeed=wishspeed.slice(); //clone
	//DON'T init resultSpeed to all zeros, it will handle pauses badly!

	//smooth (for now it assumes 16ms frametime)
	i=0;while(i<6)
	{			
		var veryclose;var dif = wishspeed[i]-controllers[controller].cam_vel_prev[i];
		if(i<3){veryclose=ep;} //translations
		else{veryclose=ep;} //looking
		if(Math.abs(dif)>veryclose)
		{
			if(i<3){smoothfactor=0.08;} //translations
			else{smoothfactor=0.08;} //looking
			resultSpeed[i] = controllers[controller].cam_vel_prev[i] + dif * smoothfactor;
		}
		controllers[controller].cam_vel_prev[i] = resultSpeed[i];i+=1;
	}
	return resultSpeed;
}
function lookThreeDof(speeds)
{
	var camera = viewer.scene.camera;
	camera.look(camera.right,speeds[0]);
	camera.look(camera.direction,speeds[1]);
	camera.look(camera.up,speeds[2]);
}
function lookTwoDof(speeds,GD_ENU_U)
{
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;
	var pitchAxis = CC3.cross(camera.direction,GD_ENU_U,new CC3());
	camera.look(pitchAxis, speeds[0]); //pitch
	camera.look(GD_ENU_U, speeds[2]);	//yaw	
}
function moveSixDofTrue(speeds)
{	
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;
	//calcs
	if(1)
	{
		camera.move(camera.right,speeds[0]);
		camera.move(camera.direction,speeds[1]);
		camera.move(camera.up,speeds[2]);
	}
	else //ideally movement smoothing should be on the resultant not component vectors
	{
		var rightC = scaleVector(speeds[0],camera.right);
		var dirC = scaleVector(speeds[1],camera.direction);
		var upC = scaleVector(speeds[2],camera.up);
		var moveVec = addVectors([rightC,dirC,upC]);
		var moveMag = CC3.magnitude(moveVec);
		moveVec = vectorUnitize(moveVec);
		camera.move(moveVec,moveMag); //move
	}
	lookThreeDof([speeds[3],speeds[4],speeds[5]]); //look
}
function moveSixDofCurved(speeds,rotmat,radius)
{
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;
	var GD_ENU_U = Cesium.Matrix3.getColumn(rotmat,2,new CC3());
	lookThreeDof([speeds[3],speeds[4],speeds[5]]); //look
	
	//calcs
	var rightC = scaleVector(speeds[0],camera.right);
	var dirC = scaleVector(speeds[1],camera.direction);
	var upC = scaleVector(speeds[2],camera.up);
	var moveVec = addVectors([rightC,dirC,upC]);
	var vertMag = CC3.dot(moveVec,GD_ENU_U,new CC3());

	camera.move(GD_ENU_U,vertMag); //move vertical

	//move horizontal along a great circle
	var vertVec = scaleVector(vertMag,GD_ENU_U);
	var horzVec = CC3.subtract(moveVec,vertVec,new CC3());
	var horzMag = CC3.magnitude(horzVec,new CC3());
	var rotateVec = CC3.cross(horzVec,GD_ENU_U,new CC3());
	var ang=Math.atan(horzMag/radius); //TODO: rather than right angle trig use partial circumference
	if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hasMagnitude(rotateVec)){}
	else{camera.rotate(rotateVec,ang);}
}
function move5DOF(speeds,rotmat,radius,camUp)
{
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;
	var GD_ENU_U = Cesium.Matrix3.getColumn(rotmat,2,new CC3());
	
	lookTwoDof([speeds[3],speeds[4],speeds[5]],GD_ENU_U); //look & fov_zoom
	
	//var levelRight = CC3.cross(camera.direction,GD_ENU_U,new CC3());	//ignores roll
	//var levelUp = CC3.cross(levelRight,camera.direction,new CC3());	//ignores roll
	
	if(camUp)
	{
		//calcs
		var rightC = scaleVector(speeds[0],camera.right);
		var dirC = scaleVector(speeds[1],camera.direction);
		var upC = scaleVector(speeds[2],camera.up);
		var moveVec = addVectors([rightC,dirC,upC]);
		var vertMag = CC3.dot(moveVec,GD_ENU_U,new CC3());
		var vertVec = scaleVector(vertMag,GD_ENU_U);
		var horzVec = CC3.subtract(moveVec,vertVec,new CC3());
		var horzMag = CC3.magnitude(horzVec,new CC3());
		var rotateVec = CC3.cross(horzVec,GD_ENU_U,new CC3());
		var ang=Math.atan(horzMag/radius);//TODO: rather than right angle trig use partial circumference
		
		//moves
		if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hasMagnitude(rotateVec)){}
		else{camera.rotate(rotateVec,ang);}
		camera.move(GD_ENU_U,vertMag); //alter radius at the end (since speeds are based on original radius)
	}
	else//world up
	{
		//remove camDir vertical component (don't need to with right vec if roll is 0)
		//another way is just do cross(up,right)
		var camDir=vectorToTransform(camera.direction,rotmat);
		camDir.z=0;camDir=vectorUnitize(camDir);
		camDir = vectorFromTransform(camDir,rotmat);
		
		//calcs
		var rightC = scaleVector(speeds[0],camera.right);
		var dirC = scaleVector(speeds[1],camDir);
		var horzVec = addVectors([rightC,dirC]);
		var horzMag = CC3.magnitude(horzVec,new CC3());
		var rotateVec = CC3.cross(horzVec,GD_ENU_U,new CC3());
		var ang=Math.atan(horzMag/radius);//TODO: rather than right angle trig use partial circumference

		//moves
		if(isNaN(ang) || isNaN(rotateVec.x) || isNaN(rotateVec.y) || isNaN(rotateVec.z) || !hasMagnitude(rotateVec)){}
		else{camera.rotate(rotateVec,ang);}		
		camera.move(GD_ENU_U,speeds[2]); //alter radius at the end (since speeds are based on original radius)
	}
}
function cameraHPR(comparedTO)
{
	//comparedTo is usually the local ENU in terms of world coordinates
	//cam_matrix are the camera vectors in terms of world coordinates
	var camera = viewer.scene.camera;
	var cam_matrix = vectorsToMatrix(camera.right,camera.direction,camera.up);
	var Lcam_matrix = matrixToTransform(cam_matrix,comparedTO);	//cam_matrix 'in terms of' comparedTO
	var temp = matrixToHPR(Lcam_matrix);
	camera.hea=temp[0];camera.pit=temp[1];camera.rol=temp[2];
}
function updateHeights()
{
	var camera=viewer.camera;
	if(1) //updates every frame, but uses currently rendered LOD
	{
		var test = new Cesium.Cartographic(camera._positionCartographic.longitude, camera._positionCartographic.latitude, 0);
		test=viewer.scene.globe.getHeight(test);
		if(isNaN(test)){return;} //DON'T set T_height to zero, simply retain its value
		else{T_height=test;}
	}
	else //sampleTerrain high detail(15) LOD every 2 seconds
	{
		var dt = new Date();
		var secs = dt.getSeconds() + (60 * dt.getMinutes()) + (60 * 60 * dt.getHours());
		if(secs > lastSampleTime + 2)
		{
			lastSampleTime=secs;
			var positions = [new Cesium.Cartographic(camera._positionCartographic.longitude, camera._positionCartographic.latitude, 0)];
			var promise = Cesium.sampleTerrain(terrainProvider, 15, positions);	//15 max
			Cesium.when(promise, function(updatedPositions) 
			{
				// positions[0].height has been updated.updatedPositions is just a reference to positions.
				if(!isNaN(updatedPositions[0].height))
				{T_height = updatedPositions[0].height;}
			});
		}
	}
}
function printStuff()
{
	//vectorToHP(transformee,transformer)	//TODO (sun and moon altitude/azimuth/range)
	
	var camera=viewer.camera;var cp=camera.position;var CC3=Cesium.Cartesian3;
	//get vector rotation components GeoCentric
	var horizP = Math.sqrt(camera.position.x * camera.position.x + camera.position.y * camera.position.y);
	var GCLAT = Math.atan2(camera.position.z,horizP);
	var GCLON = Math.atan2(camera.position.y,camera.position.x);
	var GC_ENU_E = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross({x:0,y:0,z:1},camera.position,new CC3()),new CC3());
	var GC_ENU_U = Cesium.Cartesian3.normalize(camera.position,new Cesium.Cartesian3());
	var GC_ENU_N = Cesium.Cartesian3.cross(GC_ENU_U,GC_ENU_E,new CC3());

	var buf="";
	buf+="FOV: "+Cesium.Math.toDegrees(camera.frustum.fov).toFixed(3);
	buf+=" Earth x,y,z: "+cp.x.toFixed(3)+" , "+cp.y.toFixed(3)+" , "+cp.z.toFixed(3);
	buf+=" height(camera): "+camera.positionCartographic.height.toFixed(3);
	buf+=" height(terrain): "+T_height.toFixed(3);
	buf+=" diff: "+(camera._positionCartographic.height-T_height).toFixed(3);
	buf+=" GDHEA: "+Cesium.Math.toDegrees(camera.hea).toFixed(3);
	buf+=" GDPIT: "+Cesium.Math.toDegrees(camera.pit).toFixed(3);
	buf+=" GDROL: "+Cesium.Math.toDegrees(camera.rol).toFixed(3);
	buf+=" radius: "+cp.radius.toFixed(3);
	buf+=" GDLON: "+Cesium.Math.toDegrees(camera.positionCartographic.longitude).toFixed(3);
	buf+=" GDLAT: "+Cesium.Math.toDegrees(camera.positionCartographic.latitude).toFixed(3);
	buf+=" GCLAT: "+Cesium.Math.toDegrees(GCLAT).toFixed(3);
	//buf+=" LDIF: "+Cesium.Math.toDegrees(camera._positionCartographic.latitude-GCLAT);
	//buf+=" GCLON: "+Cesium.Math.toDegrees(GCLON).toFixed(3);	//no need since GDLON = GCLON		
	document.getElementById("toolbar").innerHTML=buf;
}
function getDist(clock)
{
	var camera = viewer.camera;var cp = camera.position;
	var dist,mdist,sdist;var nearWhat;
			
	//Earth
	//camera._positionCartographic.height same as viewer.scene.globe.ellipsoid.cartesianToCartographic(cp).height
	var edist = camera._positionCartographic.height-T_height;
	dist=edist;nearWhat="Earth";

	//Moon
	if(typeof moonPosition != 'undefined') //if(Cesium.defined(moonPosition))
	{
		var temp = Math.pow(moonPosition.x-cp.x,2) + Math.pow(moonPosition.y-cp.y,2) + Math.pow(moonPosition.z-cp.z,2);
		mdist = Math.sqrt(temp)-1737400; //cp distance from Moons's semi-minor axis
		if(edist>mdist){dist=mdist;nearWhat="Moon";}
	}	

	//Sun
	if(typeof sunPosition != 'undefined') //if(Cesium.defined(sunPosition))
	{
		var temp = Math.pow(sunPosition.x-cp.x,2) + Math.pow(sunPosition.y-cp.y,2) + Math.pow(sunPosition.z-cp.z,2);
		sdist = Math.sqrt(temp)-695800000; //cp distance from Sun's radius
		if(edist>sdist){dist=sdist;nearWhat="Sun";}
	}	

	//dist misc
	if((camera._mode == 1)||(camera._mode == 2)){dist=camera.position.z;}	//doesn't appear to show moon on these modes
	dist=Math.abs(dist);	//don't care which side of the surface
	if(dist<16){dist=16;}	//treat 0 to 16 meters the same so you don't slow to a crawl
	
	return dist;
}
function runSixDof(clock)
{
	//Cesium abbreviations
	var camera = viewer.camera;var cp = camera.position;
	
	//Set camera HPR (adds .hea .pit .rol properties to the camera object)
	cameraHPR(GD_rotmat);
						
	//adjust camera
	var input,wishSpeed,resultSpeed;
	var dist = getDist(clock);
	cp.radius = Math.sqrt(cp.x*cp.x + cp.y*cp.y + cp.z*cp.z); //camera radius from Earth's center
	var i=0;while(i<controllers.length)
	{
		input=getInput(i);
		wishSpeed=getWishSpeed(input,dist);
		resultSpeed=getResultSpeed(i,wishSpeed);
		if(controllers[i].scheme=="sixDofTrue"){moveSixDofTrue(resultSpeed);}
		if(controllers[i].scheme=="sixDofCurved"){moveSixDofCurved(resultSpeed,GD_rotmat,cp.radius);}
		if(controllers[i].scheme=="fiveDofCamUp" || controllers[i].scheme=="fiveDof")
		{
			if((camera.rol!=0)&&((wishSpeed[3]!=0)||(wishSpeed[5]!=0))){camera.look(camera.direction,camera.rol);}//set roll 0
			if(controllers[i].scheme=="fiveDofCamUp"){move5DOF(resultSpeed,GD_rotmat,cp.radius,true);}
			if(controllers[i].scheme=="fiveDof"){move5DOF(resultSpeed,GD_rotmat,cp.radius,false);}
			//adjust fov
			camera.frustum.fov+= resultSpeed[4]/2; //FOV adjust since no roll
			if(camera.frustum.fov<0.0001) {camera.frustum.fov=0.0001;}
			if(camera.frustum.fov>=(Math.PI-0.001)) {camera.frustum.fov=Math.PI-0.001;}
		}
		i+=1;
	}

	//print stuff
	printStuff();
					
	//get T_height
	updateHeights();
}
function initSixDof()
{
	//init globals
	T_height = 0;	//terrain height relative to reference ellipsoid
	//these two are only used if always sampling max LOD
		lastSampleTime = 0; 
		terrainProvider = new Cesium.CesiumTerrainProvider ({url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'});	
}