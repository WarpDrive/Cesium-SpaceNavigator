/*
How to use:
Add this script to your html (change src to where-ever this is located)

<script type="text/javascript" src="./PI_manager.js"></script>

That's it! Just add/subtract plugins in initPlugins & inits
*/

var Hyper = function(){};	//Umbrella object for core modules

//scriptLoader object
Hyper.scriptLoader = function(){};
Hyper.scriptLoader.scriptCounter=0;			//only used when initializing
Hyper.scriptLoader.baseURL="../";			//goes up to build directory
Hyper.scriptLoader.extras=false;			//experimental modules not available in main release

Hyper.scriptLoader.initPlugins = function()
{
	hs=Hyper.scriptLoader;
	hs.loadScript(hs.baseURL+"Hyper/PI_HyperMath.js", hs.checkAllLoaded);							//used by all plugins
	hs.loadScript(hs.baseURL+"Hyper/PI_Common.js", hs.checkAllLoaded);								//used by all plugins
	hs.loadScript(hs.baseURL+"Hyper/PI_Input.js", hs.checkAllLoaded);								//used by all plugins
	hs.loadScript(hs.baseURL+"Hyper/PI_SpaceNavigator.js", hs.checkAllLoaded);						//manual camera adjustment plugin
	if(Hyper.scriptLoader.extras==true)
	{
		hs.loadScript(hs.baseURL+"Hyper/extras/PI_modelMatrix.js", hs.checkAllLoaded);
		hs.loadScript(hs.baseURL+"Hyper/extras/PI_ReadOut.js", hs.checkAllLoaded);								//show stats
		//hs.loadScript(hs.baseURL+"Hyper/extras/PI_Compass.js", hs.checkAllLoaded);							//show compass
		//hs.loadScript("http://maps.googleapis.com/maps/api/js?sensor=false", hs.checkAllLoaded);	//needed for geocoder,maps,streetview
		//hs.loadScript(hs.baseURL+"Hyper/extras/PI_Streetview.js", hs.checkAllLoaded);
	}
	
	//potential problem: if a script loads very fast and calls it's callback before the next loadScript command then it could mess this up.
	//Unlikely, but figure out a solution anyway.
}
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
//this is the callback
Hyper.scriptLoader.checkAllLoaded = function()
{
	Hyper.scriptLoader.scriptCounter-=1;if(Hyper.scriptLoader.scriptCounter>0){return;} //don't init anything until all is loaded
	Hyper.scriptLoader.waitForDefines();
}
//wait till Cesium and viewer are defined
Hyper.scriptLoader.waitForDefines = function()
{
	if((typeof Cesium!=='undefined')&&(typeof viewer!=='undefined'))
	{
		Hyper.scriptLoader.inits();
		console.log("Cesium loaded");
	}
	else{setTimeout(Hyper.scriptLoader.waitForDefines,200);}
}
//inits (Cesium is loaded now)
Hyper.scriptLoader.inits = function()
{
	Hyper.common.init();
	Hyper.input.init();
	Hyper.SpaceNav.init();
	if(Hyper.scriptLoader.extras==true)
	{
		Hyper.modelMatrix.init();
		readOut.init();
		//compass.init();
		//StreetView.init();
	}
	viewer.clock.onTick.addEventListener(function(clock)
	{
		Hyper.common.main(clock);//run this before the others
		Hyper.SpaceNav.main(clock);
		if(Hyper.scriptLoader.extras==true)
		{
			Hyper.modelMatrix.main(clock)
			readOut.main(clock);
			//compass.main(clock);
			//StreetView.main(clock);
		}
	});
	//maybe this instead: scene.preRender.addEventListener();
}
Hyper.scriptLoader.initPlugins();			