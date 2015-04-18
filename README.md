Navigate through Space at warp speed, orbit planets, fly over terrain, or take a relaxing stroll through a park.<br />
<br />
Be sure to include PI_Manager.js in your app. Place all .js files into the same directory. Be sure to set Hyper.scriptLoader.baseURL in PI_Manager.js accordingly.
<br />
NEW keyboard support! Click 3DWindow to activate. Where do you place your fingers? On the home keys http://en.wikipedia.org/wiki/Touch_typing <br />
s-f left-right<br />
e-d forward-back<br />
a-z up-down<br />
j-l yawLeft-yawRight<br />
i-k pitchUp-pitchDown<br />
u-o rollLeft-rollRight (roll in 5DOF controls zoom)<br />
m changes movement mode<br />
<br />
I've created a testapp here http://warpdrive.github.io/Apps/testApp.html <br />
<br />
Using a 3DMice is a MUCH better experience as you can select 350 speeds as opposed to 1 (full speed). Also it requires only 1 hand, freeing the other hand to operate the 2DMouse. To activate 3DMice just press one of the 3Dmouse buttons.<br />
Some important caveats, if you do any of these in Chromium in Windows (Chrome and Opera)<br />
-reload the webpage<br />
-minimize the browser <br />
-switch tabs <br />
It will lose connection to the 3DMouse and you have to close all tabs and reboot the browser to get it to work again. That's why I usually dedicate a browser (such as Opera) just for 3DMouse apps. I've reported this bug to Chromium in September 2014 but it is still present.<br />
<br />
To change the movement scheme type Hyper.SpaceNav.spaceCon[0]="string", replace "string" with one of the following "sixDofTrue" "sixDofCurved" "fiveDofCamUp" "fiveDof"<br />
<br />
<br />
With the 2 fiveDOF options roll action on the 3DMouse controls camera FOV. Also you can have any number of 3DMice working at the same time, I usually have the left 3DMouse for 6DOF and the right 3DMouse for 5DOF with FOV control. <br />
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
-Adaptive height adjustment: each frame compare camera ellipsoid height difference between previous and current frame and adjust accordingly.<br />
-2DMouse control over pitch and yaw<br />
