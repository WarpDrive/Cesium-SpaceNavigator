# Cesium-SpaceNavigator
Navigate through Space at warp speed, orbit planets, fly over terrain, or take a relaxing stroll through a park.

I've created a 5DOF testapp here
http://hyperscripts.atspace.tv/Cesium/Apps/Sandcastle/gallery/fiveDof.html
It can take about 20-30 sec to load which might be due to the webhost (I plan to swap soon) or perhaps because it's using the unminified version. To activate just press one of the 3Dmouse buttons.
Some important caveats, if you do any of these in Chromium in Windows (Chrome and Opera)
-reload the webpage
-minimize the browser
-switch tabs
It will lose connection to the 3DMouse and you have to close all tabs and reboot the browser to get it to work again. That's why I usually dedicate a browser (such as Opera) just for 3DMouse apps. I've reported this bug to Chromium in September 2014 but it is still present.

Console settings (ctrl-shift-i with 3dwindow in focus)
If it's not working you can try setting controllers[0].device= to other numbers, say 0 to 5. Also to determine the proper maxInput value you can type controllers[0].showRaw=true then push max in one direction and see the max value, then type controllers[0].showRaw=false then set controllers[0].maxInput= to that value. I should probably automate this process. There's also the .scales array to reverse axis direction, and .deadZones array. I do eventually plan to have a GUI for these settings, instead of having people use the console.

There's also this page which simply changes a few of the controller's properties for 6DOF True Cartesian
http://hyperscripts.atspace.tv/Cesium/Apps/Sandcastle/gallery/sixDof.html
To change the movement scheme type controllers[0].scheme="string",
replace "string" with one of the following
"sixDofTrue"
"sixDofCurved"
"fiveDofCamUp"
"fiveDof"

With the 2 fiveDOF options roll action on the 3DMouse controls camera FOV. Also you can have any number of 3DMice working at the same time, I usually have the left 3DMouse for 6DOF and the right 3DMouse for 5DOF with FOV control. When you reboot the computer often times the 3DMice change order in the GamePad array, but all you have to do is swap device numbers in the controllers array to rectify.

Browser support

Currently only Chromium engine browsers (Chrome and Opera) recoginze 3DMice.

Even though they share the same interface, these browsers don't currently recognize 3DMice:
https://msdn.microsoft.com/en-us/library/ie/dn753843(v=vs.85).aspx
https://developer.mozilla.org/en-US/docs/Web/Guide/API/Gamepad
(I can't get Cesium to work on Safari for Windows)

I get the same results using the HTML rocks tester on the various browsers
http://www.html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/tester.html

Things to note
-In 5DOF mode horizontal input moves along a circle rather than an ellipsoid geodesic, while vertical moves along the surface normal. For now a circular path seems to work just fine. Perhaps later I'll have the path conform to the ellipsoid surface, at least as an option Though I doubt anyone would really notice the difference.


TODO list
-keyboard support with ramping
-negative tilt so you can pitch the view upside down
-deadzone threshold output start at zero (this will improve FOV control)
-Adaptive maxInput sensing: keep track of the highest value inputed and set that as maxInput. This shouldn't have to be done as GamePad API is 'supposed' to set controllers from -1 to +1, but this currently isn't the case for 3DMice.
