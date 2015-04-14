/*
How to add controllers to the array:
Hyper.input controllers.push({device:1,showRaw:false,maxInput:46,deadZones:[0.01,0.01,0.01,0.01,0.01,0.01],scales:[1,-1,-1,-1,1,1]});
Hyper.input controllers.push({device:0,showRaw:false,maxInput:4,deadZones:[0.01,0.01,0.01,0.01,2,0.01],scales:[1,-1,-1,-1,1,1]});
Use controllers.pop() to remove a controller

device is array index of the GamePad API
showRaw:true displays raw input data in the console so you can figure out the maxInput of your device
deadZones are used to disable small inputs from registering, they are in terms of maxInput rather than -1 to +1
scales can be used to scale and reverse the various axis

If you don't know device or maxInput set showRaw to true to figure it out by watching the console output (ctrl-shift-i)
Later I may provide automatic discovery by continuously scanning all of the gamepad api devices
*/
Hyper.input = function(){};
Hyper.input.init = function()
{
	//setup canvas keyboard interaction
	viewer.canvas.tabIndex=1000; //setting tabIndex gives canvas the ability to have focus
	viewer.canvas.onclick = function() {viewer.canvas.focus();} //clicking the canvas gives it focus
	viewer.canvas.addEventListener("keydown", Hyper.input.canvasKeyDown, false); //when it has focus
	viewer.canvas.addEventListener("onmousemove", Hyper.input.canvasMouseMove, false); //when it has focus
	Hyper.input.waitForConnection();
}
Hyper.input.waitForConnection = function()
{
	//continuously seek until connected
	//INVESTIGATE BROWSER SUPPORT FOR
	//https://developer.mozilla.org/en-US/docs/Web/Events/gamepadconnected
	//https://developer.mozilla.org/en-US/docs/Web/Events/gamepaddisconnected
	var gp=navigator.getGamepads()[0];
	if(gp===undefined){setTimeout(function(){ Hyper.input.waitForConnection(); }, 1000);return;}
	else
	{
		var i=0;while(i<navigator.getGamepads().length-1)//seems like the last in the list is always undefined
		{
			if(navigator.getGamepads()[i].axes.length==6)
			{
				console.log("connecting "+navigator.getGamepads()[i].id);
				Hyper.input.controllers.push({
				device:i,showRaw:false,maxInput:4,deadZones:[0.01,0.01,0.01,0.01,0.01,0.01],
				scales:[1,-1,-1,-1,1,1]});
			}
			i+=1;
		}
	}
}
Hyper.input.canvasKeyDown = function(e)
{
	e = e || window.event; //for IE9
	//e.keyCode, e.altKey, e.ctrlKey, e.shiftKey
	if(e.keyCode==82){console.log("r pressed");} //r key
}
Hyper.input.canvasMouseMove= function(e)
{
	e = e || window.event; //for IE9
}
Hyper.input.controllers=[];
Hyper.input.keysDown=[];
Hyper.input.prevPageX=0;Hyper.input.deltaPageX=0;
Hyper.input.prevPageY=0;Hyper.input.deltaPageY=0;
Hyper.input.getInput = function(controller)	//TODO: have keyboard input as an option for those without joysticks/3DMice/Gamepads
{	
	var con=Hyper.input.controllers[controller];
	var mp = [0,0,0,0,0,0];var gp = navigator.getGamepads()[con.device];
	if(!gp){return mp;}
	if(con.showRaw==true){console.log(gp.axes);}
	i=0;while(i<gp.axes.length)
	{
		//get input then unitize it (ya GamePad API supposed to max at 1, but that's currently not the case for 3DMice)
		mp[i]=gp.axes[i];
		if(Math.abs(mp[i])>con.maxInput){con.maxInput=Math.abs(mp[i]);} //determine true maxInput 
		mp[i]/=con.maxInput; //convert to -1 to +1 (GamePAD API is supposed to do this already)
		
		//deal with deadzone
		if(Math.abs(mp[i])<con.deadZones[i]){mp[i]=0.0;}
		else
		{
			var sign=1;if(mp[i]<0){sign=-1;}
			var posRange=1-con.deadZones[i]; //possible range
			var myRange=1-Math.abs(mp[i]);
			mp[i]=sign*(posRange-myRange)/posRange;
		}

		//scale (do this last, might want to curve instead, otherwise partial input could cause max output)
		mp[i]*=con.scales[i]; 
		i+=1;
	}
	return mp;
}

//TODO only do if text areas are .hasfocus()==false
Hyper.input.mouseMove = function(e)	//for outside of the map3d window
{
	e = e || window.event;	//window.event is for InternetExp
	//e.button, e.screenX, e.screenY, e.clientX, e.clientY, e.pageX, e.pageY
	Hyper.input.deltaPageX=e.pageX-Hyper.input.prevPageX;Hyper.input.prevPageX=e.pageX;
	Hyper.input.deltaPageY=e.pageY-Hyper.input.prevPageY;Hyper.input.prevPageY=e.pageY;
	console.log("x ",Hyper.input.deltaPageX);
	console.log("y ",Hyper.input.deltaPageY);
}
/*
scene.screenSpaceCameraController.enableRotate = false;
scene.screenSpaceCameraController.enableTranslate = false;
scene.screenSpaceCameraController.enableZoom = false;
scene.screenSpaceCameraController.enableTilt = false;
scene.screenSpaceCameraController.enableLook = false;
*/