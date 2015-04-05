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
document['onkeyup'] = Hyper.input.keyUp;	//TODO setting document event listeners might interfere with Cesium, find out how to just add eventListener , not replace
document['onkeydown'] = Hyper.input.keyDown;
document['onmousemove'] = Hyper.input.mouseMove;
Hyper.input.controllers=[];
Hyper.input.keysDown=[];
Hyper.input.prevPageX=0;Hyper.input.deltaPageX=0;
Hyper.input.prevPageY=0;Hyper.input.deltaPageY=0;
Hyper.input.getInput = function(controller)	//TODO: have keyboard input as an option for those without joysticks/3DMice/Gamepads
{	
	var con=Hyper.input.controllers; //TODO: this module should be independent of SpaceNav
	var mp = [0,0,0,0,0,0];var gp = navigator.getGamepads()[con[controller].device];
	if(!gp){return mp;}
	if(con[controller].showRaw==true){console.log(gp.axes);}
	i=0;while(i<gp.axes.length)
	{
		mp[i]=gp.axes[i];
		if(con[controller].deadZones[i]!=0)
		{
			if(Math.abs(mp[i])<con[controller].deadZones[i]){mp[i]=0.0;}
			else
			{
				var range=Math.abs(con[controller].maxInput-con[controller].deadZones[i]);
				var conale=con[controller].maxInput/range;
				if(mp[i]>0){mp[i]-=con[controller].deadZones[i];} //i.e. 3 -> 0
				else{mp[i]+=con[controller].deadZones[i];} //i.e. -3 -> 0
				mp[i]*=conale;//i.e. maxInput 4, range 1, 1 -> 4
			}
		}
		mp[i]*=con[controller].scales[i]; //scale
		mp[i]/=con[controller].maxInput; //convert to -1 to +1 (GamePAD API is supposed to do this already)
		i+=1;
	}
	return mp;
}

//TODO only do if text areas are .hasfocus()==false
Hyper.input.keyUp = function(e)
{
	e = e || window.event;		//for IE9
	//e.keyCode, e.altKey, e.ctrlKey, e.shiftKey
	console.log(e.keyCode);

}
Hyper.input.keyDown = function(e)
{
	e = e || window.event;		//for IE9
	//e.keyCode, e.altKey, e.ctrlKey, e.shiftKey

}
Hyper.input.mouseMove = function(e)	//for outside of the map3d window
{
	e = e || window.event;	//window.event is for InternetExp
	//e.button, e.screenX, e.screenY, e.clientX, e.clientY, e.pageX, e.pageY
	Hyper.input.deltaPageX=e.pageX-Hyper.input.prevPageX;Hyper.input.prevPageX=e.pageX;
	Hyper.input.deltaPageY=e.pageY-Hyper.input.prevPageY;Hyper.input.prevPageY=e.pageY;
	console.log("x ",Hyper.input.deltaPageX);
	console.log("y ",Hyper.input.deltaPageY);
}