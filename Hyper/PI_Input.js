/*
device is array index of the GamePad API
showRaw:true displays raw input data in the console so you can figure out the maxInput of your device
deadZones are used to disable small inputs from registering, they are in terms of maxInput rather than -1 to +1
scales can be used to scale and reverse the various axis
*/
Hyper.input = function(){};
Hyper.input.controllers=[];
Hyper.input.keysDown=[];
Hyper.input.mprev={x:0,y:0,t:0};
Hyper.input.mspeed={x:0,y:0};

Hyper.input.init = function()
{
	/*
	scene.screenSpaceCameraController.enableRotate = false;
	scene.screenSpaceCameraController.enableTranslate = false;
	scene.screenSpaceCameraController.enableZoom = false;
	scene.screenSpaceCameraController.enableTilt = false;
	scene.screenSpaceCameraController.enableLook = false;
	*/
	//setup canvas keyboard interaction
	viewer.canvas.tabIndex=1000; //setting tabIndex gives canvas the ability to have focus
	viewer.canvas.onclick = function() {viewer.canvas.focus();} //clicking the canvas gives it focus
	viewer.canvas.addEventListener("keydown", Hyper.input.canvasKeyDown, false); //when it has focus
	viewer.canvas.addEventListener("keyup", Hyper.input.canvasKeyUp, false); //when it has focus
	viewer.canvas.addEventListener("mousedown", Hyper.input.canvasMouseDown, false); //when it has focus
	viewer.canvas.addEventListener("mouseup", Hyper.input.canvasMouseUp, false); //when it has focus
	viewer.canvas.addEventListener("mousemove", Hyper.input.canvasMouseMove, false); //when it has focus
	viewer.canvas.addEventListener('DOMMouseScroll', Hyper.input.canvasMouseWheel, false); //when it has focus
	viewer.canvas.addEventListener('mousewheel', Hyper.input.canvasMouseWheel, false); //when it has focus
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
		var i=0;while(i<navigator.getGamepads().length-1)//freezes on the last entry
		{
			//if(navigator.getGamepads()[i]===undefined){continue;}
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
	var hik=Hyper.input.keysDown;
	var present=0;
	var i=0;while(i<hik.length)
	{
		//shouldn't be necessary
		if(e.keyCode==hik[i]){present=1;break}
		i+=1;
	}
	if(present==0){hik.push(e.keyCode);}
}
Hyper.input.canvasKeyUp = function(e)
{
	e = e || window.event; //for IE9
	//e.keyCode, e.altKey, e.ctrlKey, e.shiftKey
	var hik=Hyper.input.keysDown;
	var i=0;while(i<hik.length)
	{
		if(e.keyCode==hik[i])
		{
			hik[i]=hik[hik.length-1];//copy last element to fill in it's place
			hik.pop();//remove last element
			break;//out of while loop
		}
		i+=1;
	}
}
Hyper.input.canvasMouseDown = function(e)
{
	e = e || window.event; //for IE9
	//if(e.button==0){console.log("left pressed")};
}
Hyper.input.canvasMouseUp = function(e)
{
	e = e || window.event; //for IE9
	//if(e.button==0){console.log("left un-pressed")};
}
Hyper.input.canvasMouseMove = function(e)
{
	var hi=Hyper.input;
	e = e || window.event; //for IE9
	var rect = viewer.canvas.getBoundingClientRect();
	var x=e.clientX-rect.left;
	var y=e.clientY-rect.top;
	var t=new Date().getTime();
	var tdelta=t-hi.mprev.t;
	var mdelta={x:x-hi.mprev.x,y:y-hi.mprev.y};
	var sx=mdelta.x/tdelta;var sy=mdelta.y/tdelta;
	if(isNaN(sx)||isNaN(sy)){hi.mspeed={x:0,y:0};}
	else{hi.mspeed={x:sx,y:sy};}
	hi.mprev={x:x,y:y,t:t};
}
Hyper.input.canvasMouseWheel = function(e)
{
	e = e || window.event; //for IE9
	//console.log("mousewheel");
}
Hyper.input.getInput = function(controller)	//TODO: have keyboard input as an option for those without joysticks/3DMice/Gamepads
{	
	//2DMouse
	var t=new Date().getTime();
	if(t>Hyper.input.mprev.t+100){Hyper.input.mspeed={x:0,y:0};}//no recent input so make it zero
	//3DMouse
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