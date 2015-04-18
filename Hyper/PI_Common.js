//Purpose: calculate shared resources once per frame for greater efficiency
Hyper.common = function(){};

//TODO keep track of frametime, var timeNow = new Date().getTime();
Hyper.common.icrfToFixed;		//ICRF to Earth Fixed (type Matrix3)
Hyper.common.moonPosition;		//in terms of ICRF, (type Cartesian3)
Hyper.common.sunPosition;		//in terms of ICRF, (type Cartesian3)
Hyper.common.moonPositionEF;	//in terms of Earth Fixed, (type Cartesian3)
Hyper.common.sunPositionEF;		//in terms of Earth Fixed, (type Cartesian3)
Hyper.common.GD_transform;		//ENU&pos in terms of camera position (type Matrix4)
Hyper.common.GD_rotmat;			//ENU in terms of camera position (type Matrix3)
Hyper.common.GC_rotmat;			//ENU in terms of camera position (type Matrix3)
Hyper.common.GC_carto;			//GeoCentric Cartographic
Hyper.common.mycam;				//Camera properties
Hyper.common.T_height;			//terrain height
Hyper.common.lastSampleTime;	//only used if using alternative get height method
Hyper.common.terrainProvider;	//only used if using alternative get height method
Hyper.common.prevFrame;			//time of previous frame
Hyper.common.pref=false;		//personal preferences

Hyper.common.init = function()
{
	//personal preferences
	if(Hyper.common.pref==true)
	{
		viewer.scene.terrainProvider = new Cesium.CesiumTerrainProvider
		({
			url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
			,requestVertexNormals : true
			,requestWaterMask: true
		});	
		viewer.scene.globe.enableLighting = true;
		viewer.sceneModePicker.viewModel.duration=0;
		//viewer.scene.globe.maximumScreenSpaceError = 1;
	}

	var CC3=Cesium.Cartesian3;var CM3=Cesium.Matrix3;var hc=Hyper.common;
	//camera.frustum.far = 1e12;
	hc.icrfToFixed = new CM3();		//shares origin with Earth Fixed	
	hc.moonPosition=new CC3();		//in terms of ICRF
	hc.sunPosition=new CC3();		//in terms of ICRF
	hc.moonPositionEF=new CC3();	//in terms of Earth Fixed
	hc.sunPositionEF=new CC3();		//in terms of Earth Fixed
	hc.GD_transform = new Cesium.Matrix4();//in terms of Earth Fixed
	hc.GD_rotmat = new CM3();		//in terms of Earth Fixed
	hc.GC_rotmat = new CM3();		//in terms of Earth Fixed
	hc.GC_carto = {lon:0,lat:0,rad:0};//geocentric cartographic
	hc.mycam = {hea:0,pit:0,rol:0,til:0,Ldir:{x:0,y:0,z:0},Lrig:{x:0,y:0,z:0},Lup:{x:0,y:0,z:0}};//in terms of local EastNorthUp
	
	hc.T_height=0;	//terrain height relative to reference ellipsoid
	hc.lastSampleTime = 0; 
	hc.terrainProvider = new Cesium.CesiumTerrainProvider
	({url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'});	
}
Hyper.common.main = function(clock)
{
	var hc=Hyper.common;
	hc.prevFrame=new Date().getTime();
	hc.updateFrames(clock);
	hc.updateCelestial(clock);//update icrfToFixed first
	hc.updateHeights();
}
Hyper.common.updateFrames = function(clock)
{
	var camera = viewer.scene.camera;var CC3=Cesium.Cartesian3;var cp = camera.position;var hc=Hyper.common;
	
	//Earth GeoDetic reference frame at camera
	hc.GD_transform = Cesium.Transforms.eastNorthUpToFixedFrame(cp, viewer.scene.globe.ellipsoid, new Cesium.Matrix4());//rot-tran
	hc.GD_rotmat = Cesium.Matrix4.getRotation(hc.GD_transform,new Cesium.Matrix3());//rot
	
	//can use this is all you want to know is up
	//Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(position, normalScratch)
	//investigate this: SceneTransforms.wgs84ToWindowCoordinates
	
	//Earth GeoCentric reference frame at camera
	var horizP = Math.sqrt(cp.x * cp.x + cp.y * cp.y);
	hc.GC_carto.lon = Math.atan2(cp.y,cp.x);	//same as geodetic lon
	hc.GC_carto.lat = Math.atan2(cp.z,horizP);	//unitize cp if using acos
	hc.GC_carto.rad = CC3.magnitude(cp);
	//reference frame at camera
	var GC_ENU_E = CC3.normalize(CC3.cross({x:0,y:0,z:1},cp,new CC3()),new CC3());
	var GC_ENU_U = CC3.normalize(cp,new CC3());
	var GC_ENU_N = CC3.cross(GC_ENU_U,GC_ENU_E,new CC3());
	hc.GC_rotmat = Hyper.math3D.vectorsToMatrix(GC_ENU_E,GC_ENU_N,GC_ENU_U);

	//ICRF (is it the same as Earth Fixed except that is rotates around Z axis at sidereal time?)
	if (!Cesium.defined(Cesium.Transforms.computeIcrfToFixedMatrix(clock.currentTime, hc.icrfToFixed))) 
	{Cesium.Transforms.computeTemeToPseudoFixedMatrix(clock.currentTime, hc.icrfToFixed);console.log("used teme");}
	Cesium.Matrix3.transpose(hc.icrfToFixed,hc.icrfToFixed); //swap from row based to column based
}
Hyper.common.updateCelestial = function(clock)
{
	var hc=Hyper.common;
	//Get Sun and Moon positions. Hopefully someday other planets as well such as Venus and Jupiter.
	hc.moonPosition = Cesium.Simon1994PlanetaryPositions.computeMoonPositionInEarthInertialFrame(clock.currentTime);
	hc.moonPositionEF = Hyper.math3D.vectorToTransform(hc.moonPosition,hc.icrfToFixed);
	hc.sunPosition = Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(clock.currentTime);
	hc.sunPositionEF = Hyper.math3D.vectorToTransform(hc.sunPosition,hc.icrfToFixed);
	//viewer.scene.moon._ellipsoidPrimitive._modelMatrix is Celestial or EF?
	//viewer.scene.sun._boundingVolume.center is Celestial or EF?
}
Hyper.common.cameraHPR = function(comparedTO)
{
	//comparedTo is usually the local ENU in terms of world coordinates
	//cam_matrix are the camera vectors in terms of world coordinates
	//TODO: maybe allow the ability to replace cam_matrix with camera in terms of something else
	//but remember that comparedTO needs to be in terms of the same thing
	
	var CC3=Cesium.Cartesian3;
	if((viewer.scene.mode==1)||(viewer.scene.mode==2)) //Columbus & 2D
	{comparedTO=[1,0,0,0,1,0,0,0,1];}
	
	var camera = viewer.scene.camera;var hm3=Hyper.math3D;
	var cam_matrix = hm3.vectorsToMatrix(camera.right,camera.direction,camera.up);
	var Lcam_matrix = hm3.matrixToTransform(cam_matrix,comparedTO);	//cam_matrix 'in terms of' comparedTO
	var temp = hm3.matrixToHPR(Lcam_matrix);
	Hyper.common.mycam.hea=temp[0];Hyper.common.mycam.pit=temp[1];Hyper.common.mycam.rol=temp[2];
		
	/* uncomment this if you find a good use for this
	Hyper.common.mycam.Ldir=new CC3(Lcam_matrix[0],Lcam_matrix[1],Lcam_matrix[2]);
	Hyper.common.mycam.Lrig=new CC3(Lcam_matrix[3],Lcam_matrix[4],Lcam_matrix[5]);
	Hyper.common.mycam.Lup=new CC3(Lcam_matrix[6],Lcam_matrix[7],Lcam_matrix[8]);
	*/
}
Hyper.common.updateHeights = function() //updates Hyper.common.T_height
{
	var camera=viewer.camera;
	if(1) //updates every frame, but uses currently rendered LOD
	{
		var test = new Cesium.Cartographic(camera._positionCartographic.longitude, camera._positionCartographic.latitude, 0);
		test=viewer.scene.globe.getHeight(test);
		if(isNaN(test)){return;} //DON'T set Hyper.common.T_height to zero, simply retain its value
		else{Hyper.common.T_height=test;}
	}
	/*
	else //sampleTerrain high detail(15) LOD every 2 seconds
	{
		var dt = new Date();
		var secs = dt.getSeconds() + (60 * dt.getMinutes()) + (60 * 60 * dt.getHours());
		//var ms = dt.getMilliseconds() + (1000 * dt.getSeconds()) + (1000 * 60 * dt.getMinutes()) + (1000 * 60 * 60 * dt.getHours()));
		if(secs > Hyper.common.lastSampleTime + 2)
		{
			Hyper.common.lastSampleTime=secs;
			var positions = [new Cesium.Cartographic(camera._positionCartographic.longitude, camera._positionCartographic.latitude, 0)];
			var promise = Cesium.sampleTerrain(Hyper.common.terrainProvider, 15, positions);	//15 max
			Cesium.when(promise, function(updatedPositions) 
			{
				// positions[0].height has been updated.updatedPositions is just a reference to positions.
				if(!isNaN(updatedPositions[0].height))
				{Hyper.common.T_height = updatedPositions[0].height;}
			});
		}
	}
	*/
}