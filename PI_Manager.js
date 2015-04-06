/*
How to use:
Add this script to your html (change src to where-ever this is located)
<script type="text/javascript" src="./PI_manager.js"></script>

Place the following code into the script portion (note: don't put var in front of viewer as it's declared here as a global)
viewer = new Cesium.Viewer('cesiumContainer');
Hyper.scriptLoader.initPlugins(Cesium);

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
    Hyper.scriptLoader.initPlugins(Cesium);
}, 3000);

That's it! Just add/subtract plugins in initPlugins & checkAllLoaded
*/

//Make these global. Sandcastle apps try to make these local which is no good for Plug-ins
var Cesium,viewer;			//Cesium vars
var Hyper = function(){};	//Umbrella object for core modules

//scriptLoader object
Hyper.scriptLoader = function(){};
Hyper.scriptLoader.scriptCounter=0;			//only used when initializing
Hyper.scriptLoader.baseURL="./";
//scriptLoader.baseURL="http://hyperscripts.atspace.tv/";

Hyper.scriptLoader.loadScript = function(url, callback)
{
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = callback; //IE?
    script.onload = callback;
    head.appendChild(script);
	Hyper.scriptLoader.scriptCounter+=1;
}
//this is called by the app
Hyper.scriptLoader.initPlugins = function(pcesium)
{
	hs=Hyper.scriptLoader;
	//this is where plugins can declare globals as well
	Cesium=pcesium;	//global reference to passed parameter
	hs.loadScript(hs.baseURL+"PI_HyperMath.js", hs.checkAllLoaded);								//used by all plugins
	hs.loadScript(hs.baseURL+"PI_Common.js", hs.checkAllLoaded);								//used by all plugins
	hs.loadScript(hs.baseURL+"PI_Input.js", hs.checkAllLoaded);									//used by all plugins
	hs.loadScript(hs.baseURL+"PI_SpaceNavigator.js", hs.checkAllLoaded);						//manual camera adjustment plugin
	//hs.loadScript(hs.baseURL+"PI_ReadOut.js", hs.checkAllLoaded);								//show stats
	//hs.loadScript(hs.baseURL+"PI_Compass.js", hs.checkAllLoaded);								//show compass
	//hs.loadScript("http://maps.googleapis.com/maps/api/js?sensor=false", hs.checkAllLoaded);	//needed for geocoder,maps,streetview
	//hs.loadScript(hs.baseURL+"PI_Streetview.js", hs.checkAllLoaded);
	
	//potential problem: if a script loads very fast and calls it's callback before the next loadScript command then it could mess this up.
	//Unlikely, but figure out a solution anyway.
}
//this is the callback
Hyper.scriptLoader.checkAllLoaded = function()
{
	Hyper.scriptLoader.scriptCounter-=1;if(Hyper.scriptLoader.scriptCounter>0){return;} //don't init anything until all is loaded
	Hyper.common.init();
	Hyper.SpaceNav.init();
	//readOut.init();
	//compass.init();
	//StreetView.init();
	Hyper.scriptLoader.callBack();//init extra stuff
	viewer.clock.onTick.addEventListener(function(clock)
	{
		Hyper.common.main(clock);//run this before the others
		Hyper.SpaceNav.main(clock);
		//readOut.main(clock);
		//compass.main(clock);
		//StreetView.main(clock);
	});
};
					