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

//TODO: check for double click (1st click starts a timer, if 2nd click occurs while timer active)
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
	viewer.canvas.addEventListener("keydown", function(e){Hyper.input.keyDown(e,"canvas");}, false);
	viewer.canvas.addEventListener("keyup", function(e){Hyper.input.keyUp(e,"canvas");}, false); 
	viewer.canvas.addEventListener("mousedown", Hyper.input.canvasMouseDown, false); 
	viewer.canvas.addEventListener("mouseup", Hyper.input.canvasMouseUp, false); 
	viewer.canvas.addEventListener("mousemove", Hyper.input.canvasMouseMove, false);
	viewer.canvas.addEventListener('DOMMouseScroll', Hyper.input.canvasMouseWheel, false);
	viewer.canvas.addEventListener('mousewheel', Hyper.input.canvasMouseWheel, false);
	
	//setup timeline interaction
	viewer.timeline._timeBarEle.tabIndex=1001;
	viewer.timeline._timeBarEle.onclick = function() {viewer.timeline._timeBarEle.focus();}
	viewer.timeline._timeBarEle.addEventListener("keydown", function(e){Hyper.input.keyDown(e,"timeline");}, false); 
	viewer.timeline._timeBarEle.addEventListener("keyup", function(e){Hyper.input.keyUp(e,"timeline");}, false); 
	//createMouseWheelCallback in Timeline.js
	//JulianDate.secondsDifference in JulianDate.js
	
	//3DMice setup
	Hyper.input.waitForConnection();
	
	//viewer.clock.multiplier	//sim speed
	//viewer.clock.currentTime	//sim time
	//shuttleRing
	
	//viewer.timeline._topDiv
	//viewer.timeline._timeBarEle //graphic
	//viewer.timeline._startJulian.dayNumber
	//viewer.timeline._startJulian.secondsOfDay
	//viewer.timeline._endJulian.dayNumber
	//viewer.timeline._endJulian.secondsOfDay
	//viewer.timeline._scrubJulian
	//viewer.timeline._timeBarSecondsSpan //range(read only)
	//document.activeElement
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
				device:i,showRaw:false,maxInput:1,deadZones:[0.01,0.01,0.01,0.01,0.01,0.01],
				scales:[1,-1,-1,-1,1,1]});
			}
			i+=1;
		}
	}
}
Hyper.input.callAction = function(code,source)	//TODO: move to PI_inputBind.js
{
	var hs=Hyper.SpaceNav;
	if(source=='timeline')
	{
		console.log("pressed "+code+" on timeline");
	}
	if(source=='canvas')
	{
		if(code==77){hs.keyboardCon+=1;if(hs.keyboardCon>hs.moveTypes.length-1){hs.keyboardCon=0;}}//m movetype
		if(code==78){viewer.scene.camera.look(viewer.scene.camera.direction,Math.PI);}//n flip
	}
}
Hyper.input.keyDown = function(e,source)
{
	e = e || window.event; //for IE9
	//e.keyCode, e.altKey, e.ctrlKey, e.shiftKey
	
	//trigger functions
	Hyper.input.callAction(e.keyCode,source);
	
	//update keysDown list
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
Hyper.input.keyUp = function(e,source)
{
	e = e || window.event; //for IE9
	//e.keyCode, e.altKey, e.ctrlKey, e.shiftKey
	
	//update keysDown list
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
	//viewer.canvas.clientHeight
	//viewer.canvas.clientWidth
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
Hyper.input.getInput = function(controller)
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
		//get input
		mp[i]=gp.axes[i];
		
		//unitize it (fix for older browsers which got the wrong max input)
		if(Math.abs(mp[i])>con.maxInput){con.maxInput=Math.abs(mp[i]);} //determine true maxInput 
		mp[i]/=con.maxInput; //convert to -1 to +1
		
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
/*
	.addEventListener('touchstart', onTouchStart, false);
	.addEventListener('touchmove', onTouchMove, false);
	.addEventListener('touchend', onTouchEnd, false);
*/