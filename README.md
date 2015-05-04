Navigate through Space at warp speed, orbit planets, fly over terrain, or take a relaxing stroll through a park.<br />
<br />
Be sure to include PI_Manager.js in your app. Place all .js files into the same directory. Be sure to set Hyper.scriptLoader.baseURL in PI_Manager.js accordingly.
<br />
<br />
NEW keyboard support! Click 3DWindow to activate. Where do you place your fingers? On the home keys http://en.wikipedia.org/wiki/Touch_typing <br />
continuous keys<br />
s-f left-right<br />
e-d forward-back<br />
a-z up-down<br />
j-l yawLeft-yawRight<br />
i-k pitchUp-pitchDown<br />
u-o rollLeft-rollRight (roll in 5DOF controls zoom)<br />

instant keys<br />
m changes movement mode<br />
n flip(nifty feature when you're upside-down in 5DOF mode)<br />
<br />
I've created a testapp here http://warpdrive.github.io/Apps/testApp.html <br />
<br />
Using a 3DMouse is a MUCH better experience as you can select 350 speeds as opposed to 1 (full speed). Also it requires only 1 hand, freeing the other hand to operate the 2DMouse. To activate a 3DMouse just press one of the 3Dmouse buttons.<br />
Speed is tied to FOV, so if you want to go faster increase your FOV. I cap at 140deg FOV as any more is horribly warped anyways.

<br />
<br />
To change the movement scheme type for 1st 3DMouse do Hyper.SpaceNav.spaceCon[0]="string", replace "string" with one of the following "sixDofTrue" "sixDofCurved" "fiveDofCamUp" "fiveDof"<br />
Hyper.SpaceNav.keyboardCon = number for keyboard (0='fiveDof',1='fiveDofCamUp',2='sixDofTrue',3='sixDofCurved' (or press m to cycle)<br />
"sixDofTrue" - Just regular 6DOF, this is best for Outer Space travelling<br />
"sixDofCurved" - Movement is along Great Circles instead of 'true' Cartesian, sort of like a 'curved' Cartesian coordinate system<br />
"fiveDof" - vertical controls alter radius while horizontal travels around Great circles<br />
"fiveDofCamUp" -  like fiveDof, however your pitch angle dictates how vertical and horizontal movements are divied up<br />
With the 2 fiveDOF options roll action on the 3DMouse controls camera FOV. Also you can have any number of 3DMice working at the same time, I usually have the left 3DMouse for 6DOF and the right 3DMouse for 5DOF with FOV control. <br />
<br />
<br />
Browser support<br />
<br />
Currently only Chromium engine browsers (Chrome and Opera) recognize 3DMice.<br />
<br />
Even though they share the same interface, these browsers don't currently recognize 3DMice: https://msdn.microsoft.com/en-us/library/ie/dn753843(v=vs.85).aspx https://developer.mozilla.org/en-US/docs/Web/Guide/API/Gamepad (I can't get Cesium to work on Safari for Windows)<br />
<br />
I get the same results using the HTML rocks tester on the various browsers http://www.html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/tester.html <br />
<br />
TODO list<br />
-place label on Luna so that you can see even from Sol to aid in interplanetary travel.<br>
-Adaptive height adjustment: each frame compare camera ellipsoid height difference between previous and current frame and adjust accordingly.<br />
-2DMouse control over pitch and yaw<br />
-Maybe have a movement scheme that moves along great circles, but maintains a north pole heading.<br />
-Maybe have a movement scheme that moves along latitude and longitude lines<br />
