/*
How to use:
Add this script to your html (change src to where-ever this is located)
<script type="text/javascript" src="./PI_manager.js"></script>

Place the following code into the script portion (note: don't put var in front of viewer as it's declared here as a global)
viewer = new Cesium.Viewer('cesiumContainer');
initPlugins(Cesium);

For sandcastle apps online put this in javascript code instead
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = "http://hyperscripts.atspace.tv/PI_manager.js";
    //script.onreadystatechange = callback; //IE?
    //script.onload = callback;
    head.appendChild(script);
setTimeout(function()
{
    viewer = new Cesium.Viewer('cesiumContainer');
    initPlugins(Cesium);
}, 3000);

That's it! Just add/subtract plugins in initPlugins & checkAllLoaded
*/

//global vars accesible by all plugins
var Cesium,viewer,terrainProvider;							//cesium vars
var scriptCounter=0;										//only used when initializing (could be deleted after)
var GD_transform,GD_rotmat,moonPosition,SunPosition;		//shared plugin resources (so each plugin doesn't have to recalc each frame)
var controllers=[];
var baseURL="./";
//baseURL="http://hyperscripts.atspace.tv/";

function loadScript(url, callback)
{
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = callback; //IE?
    script.onload = callback;
    head.appendChild(script);
	scriptCounter+=1;
}

//this is called by the app
function initPlugins(pcesium)
{
	//this is where plugins can declare globals as well
	Cesium=pcesium;	//global reference to passed parameter
	loadScript(baseURL+"PI_Common.js", checkAllLoaded);
	loadScript(baseURL+"PI_HyperMath.js", checkAllLoaded);
	loadScript(baseURL+"PI_SpaceNavigator.js", checkAllLoaded);
	//loadScript(baseURL+"PI_Compass.js", checkAllLoaded);
	//loadScript("http://maps.googleapis.com/maps/api/js?sensor=false", checkAllLoaded); //needed for geocoder,maps,streetview
	//loadScript(baseURL+"PI_Streetview.js", checkAllLoaded);
}

//this is the callback
var checkAllLoaded = function()
{
	scriptCounter-=1;if(scriptCounter>0){return;} //don't init anything until all is loaded
	initCommon();
	initSixDof();
	//initCompass();
	viewer.clock.onTick.addEventListener(function(clock)
	{
		runCommon(clock);
		runSixDof(clock);
		//runCompass(clock);
	});
};
/*
	Tricks (note this seems to only work if the script files are in the same directory as the html)
	runCompass=function(){} in console will disable compass updating (model will remain in the last place put) do loadscript to re-define it
*/
					