Navigate through Space at warp speed, orbit planets, fly over terrain, or take a relaxing stroll through a park.

Place in /Build folder of your Cesium install.

NEW keyboard support! Where do you place your fingers? On the home keys http://en.wikipedia.org/wiki/Touch_typing
s-f left-right
e-d forward-back
a-z up-down
j-l yawLeft-yawRight
i-k pitchUp-pitchDown
u-o rollLeft-rollRight (roll in 5DOF controls zoom)
m changes movement mode

I've created a testapp here http://warpdrive.github.io/Apps/testApp.html To activate just press one of the 3Dmouse buttons. Some important caveats, if you do any of these in Chromium in Windows (Chrome and Opera)
-reload the webpage
-minimize the browser 
-switch tabs 
It will lose connection to the 3DMouse and you have to close all tabs and reboot the browser to get it to work again. That's why I usually dedicate a browser (such as Opera) just for 3DMouse apps. I've reported this bug to Chromium in September 2014 but it is still present.

To change the movement scheme type Hyper.SpaceNav.spaceCon[0]="string", replace "string" with one of the following "sixDofTrue" "sixDofCurved" "fiveDofCamUp" "fiveDof"

With the 2 fiveDOF options roll action on the 3DMouse controls camera FOV. Also you can have any number of 3DMice working at the same time, I usually have the left 3DMouse for 6DOF and the right 3DMouse for 5DOF with FOV control. 

Browser support

Currently only Chromium engine browsers (Chrome and Opera) recognize 3DMice.

Even though they share the same interface, these browsers don't currently recognize 3DMice: https://msdn.microsoft.com/en-us/library/ie/dn753843(v=vs.85).aspx https://developer.mozilla.org/en-US/docs/Web/Guide/API/Gamepad (I can't get Cesium to work on Safari for Windows)

I get the same results using the HTML rocks tester on the various browsers http://www.html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/tester.html

TODO list
-Adaptive height adjustment: each frame compare camera ellipsoid height difference between previous and current frame and adjust accordingly.

