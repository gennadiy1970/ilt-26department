var camera,renderer,object,scene,group,container3D,iCanvas3DWidth,iCanvas3DHeight,SpinRadius,SpinLength,SpinWidth,SpinArrowWidth,SpinArrowLength,material_green=[new THREE.MeshLambertMaterial({color:65280})],material_blue=[new THREE.MeshLambertMaterial({color:255})],material_red=[new THREE.MeshLambertMaterial({color:16711680})],material_lattice=[new THREE.MeshLambertMaterial({color:16776960})],SpinRotator=new THREE.Vector3,directionalLight=new THREE.DirectionalLight(16777215),ambientLight=new THREE.AmbientLight(4473924),b3DSupport=!1,spin_scale=1,total_scale=1,Mesh3DNum=10,iSystemSize=9,rotx=20,roty=0,rotz=0,state=(spin_scale=1,total_scale=1,{first_event:!0,is_clicking:!1,button:0,last_x:0,last_y:0}),wrapper=document.getElementById("wrapper");function webGLStart(){container3D=document.getElementById("box"),Init3D(wrapper.offsetWidth,wrapper.offsetHeight)?wrapper.style.background="#000060":wrapper.innerHTML=window.WebGLRenderingContext?['Sorry, your graphics card doesn\'t support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>'].join("\n"):['Sorry, your browser doesn\'t support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a><br/>',"Please try with",'<a href="http://www.google.com/chrome">Chrome</a>, ','<a href="http://www.mozilla.com/en-US/firefox/new/">Firefox 4</a> or','<a href="http://nightly.webkit.org/">Webkit Nightly (Mac)</a>'].join("\n"),posx=0,posy=0,posz=0,vPlot3D()}function Init3D(e,t){iCanvas3DWidth=e,iCanvas3DHeight=t,SpinRadius=Math.min(iCanvas3DWidth,iCanvas3DHeight)/90,SpinArrowWidth=2*(SpinWidth=.1*SpinRadius),SpinArrowLength=.5*(SpinLength=2.5*SpinRadius),directionalLight.position.set(1,1,1).normalize(),(camera=new THREE.PerspectiveCamera(45,iCanvas3DWidth/iCanvas3DHeight,1,1e3)).position.z=700;try{return(renderer=new THREE.WebGLRenderer({alpha:!0})).domElement.id="GL_CANVAS",renderer.setSize(iCanvas3DWidth,iCanvas3DHeight),container3D.appendChild(renderer.domElement),b3DSupport=!0}catch(e){return b3DSupport=!1}}function vDrawSpin(e,t,o,i,r,a){var n;b3DSupport&&(SpinRotator.y=1,SpinRotator.x=0,n=(SpinRotator.z=0)==a?material_green:material_red,(object=THREE.SceneUtils.createMultiMaterialObject(new THREE.SphereGeometry(spin_scale*SpinRadius,Mesh3DNum,Mesh3DNum,!1),n)).position.set(e,t,o),object.overdraw=!0,group.add(object),(object=THREE.SceneUtils.createMultiMaterialObject(new THREE.CylinderGeometry(spin_scale*SpinWidth,spin_scale*SpinWidth,spin_scale*SpinLength,Mesh3DNum,Mesh3DNum,!1),n)).rotation.z=i,object.rotation.y=Math.PI-r,object.translate(t+spin_scale*SpinLength/2,SpinRotator),object.position.x+=e,object.position.y+=t,object.position.z+=o,object.overdraw=!0,group.add(object),(object=THREE.SceneUtils.createMultiMaterialObject(new THREE.CylinderGeometry(0,spin_scale*SpinArrowWidth,spin_scale*SpinArrowLength,Mesh3DNum,Mesh3DNum,!1),n)).rotation.z=i,object.rotation.y=Math.PI-r,object.translate(t+spin_scale*(SpinLength+SpinArrowLength/2),SpinRotator),object.position.x+=e,object.position.y+=t,object.position.z+=o,object.overdraw=!0,group.add(object))}function vPlot3D(){if(b3DSupport){if(scene&&0<scene.children.length){for(var e=0;e<scene.children.length;e++)delete scene.children[e];delete scene}if(group&&0<group.children.length){for(e=0;e<group.children.length;e++)delete group.children[e];delete group}var t,o,i,r,a=iSystemSize/2,n=total_scale*iCanvas3DWidth/(2*iSystemSize);scene=new THREE.Scene,(group=new THREE.Object3D).scale.set(spin_scale*total_scale,spin_scale*total_scale,spin_scale*total_scale),scene.add(group);for(var s=0;s<=iSystemSize;s++)for(e=0;e<=iSystemSize;e++){switch(t=(s-a)*n,o=(e-a)*n,s%3){case 0:r=e%2==0?i=0:(i=Math.PI,1);break;case 1:i=Math.PI,r=1;break;case 2:r=e%2!=0?i=0:(i=Math.PI,1)}vDrawSpin(t,0,o,i,0,r)}vPlotAxis(),scene.add(ambientLight),scene.add(directionalLight),group.rotation.x=rotx,group.rotation.y=roty,group.rotation.z=rotz,renderer.render(scene,camera)}}function vPlotAxis(){for(var e=.8*spin_scale*SpinWidth,t=iSystemSize/2,o=total_scale*iCanvas3DWidth/(2*iSystemSize),i=0;i<=iSystemSize;i++)(object=THREE.SceneUtils.createMultiMaterialObject(new THREE.CylinderGeometry(e,e,iSystemSize*o,Mesh3DNum,Mesh3DNum,!1),material_lattice)).rotation.z=0,object.rotation.y=0,object.rotation.x=Math.PI/2,object.position.x=(i-t)*o,object.overdraw=!0,group.add(object);for(i=0;i<=iSystemSize;i++)(object=THREE.SceneUtils.createMultiMaterialObject(new THREE.CylinderGeometry(e,e,iSystemSize*o,Mesh3DNum,Mesh3DNum,!1),material_lattice)).rotation.z=0,object.rotation.z=Math.PI/2,object.position.z=(i-t)*o,object.overdraw=!0,group.add(object);for(i=0;i<iSystemSize;i++)for(var r=0;r<iSystemSize;r++)i%2==0&&r%2==0&&((object=THREE.SceneUtils.createMultiMaterialObject(new THREE.CylinderGeometry(e,e,Math.sqrt(2)*o,Mesh3DNum,Mesh3DNum,!1),material_lattice)).rotation.z=Math.PI/2,object.rotation.y=0,object.rotation.y=Math.PI/4,object.position.x=(i-t+.5)*o,object.position.z=(r-t+.5)*o,object.overdraw=!0,group.add(object)),i%2!=0&&r%2!=0&&((object=THREE.SceneUtils.createMultiMaterialObject(new THREE.CylinderGeometry(e,e,Math.sqrt(2)*o,Mesh3DNum,Mesh3DNum,!1),material_lattice)).rotation.z=Math.PI/2,object.rotation.y=0,object.rotation.y=-Math.PI/4,object.position.x=(i-t+.5)*o,object.position.z=(r-t+.5)*o,object.overdraw=!0,group.add(object))}function bContextID(e){var t=e.srcElement?e.srcElement:e.target;return"GL_CANVAS"===(t?t.id?t.id:"NO ID":"NO TARGET")}function relXY(e){if("number"==typeof e.offsetX)return{x:e.offsetX,y:e.offsetY};var t={x:0,y:0},o=e.target,i=o.offsetParent;return i&&(t.x+=o.offsetLeft-i.offsetLeft,t.y+=o.offsetTop-i.offsetTop),{x:e.layerX-t.x,y:e.layerY-t.y}}window.onmousemove=function(e){if(b3DSupport&&bContextID(e)){var t=relXY(e),o=state.last_x-t.x,i=state.last_y-t.y;state.last_x=t.x,state.last_y=t.y,state.first_event?state.first_event=!1:state.is_clicking&&(1===state.button?(rotx-=i/180,roty-=o/180):2===state.button&&(roty-=i/180,rotz+=o/180),group.rotation.x=rotx,group.rotation.y=roty,group.rotation.z=rotz,renderer.render(scene,camera)),e.preventDefault()}},window.onmouseup=function(e){b3DSupport&&bContextID(e)&&(state.is_clicking=!1,e.preventDefault())},window.onmousedown=function(e){if(b3DSupport&&bContextID(e)){var t=relXY(e);state.is_clicking=!0,0===e.button&&(state.button=1),2===e.button&&(state.button=2),state.last_x=t.x,state.last_y=t.y,e.preventDefault()}};