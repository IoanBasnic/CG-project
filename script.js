


function getMat(color){
    return new THREE.MeshStandardMaterial({
      color:color,
      roughness:.9,
      emissive:0x270000,
      shading:THREE.FlatShading
    });
  }
  
  // colors
  
  var Colors = {
    custom_color1 : 0x687864,
    custom_color2 : 0x31708E,
    custom_color3 : 0x5085A5,
    custom_color4 : 0x8FC1E3,
    custom_color5 : 0xF7F9FB,
    custom_color6 : 0x0E0816,
    custom_color7 : 0xA239CA,
    custom_color8 : 0x4717F6,
    custom_color9 : 0xE7DFDD
  }
  
  
  
  var colorsLength = Object.keys(Colors).length;
  
  function getRandomColor(){
    var colIndx = Math.floor(Math.random()*colorsLength);
    var colorStr = Object.keys(Colors)[colIndx];
    return Colors[colorStr];
  }
  
  // parameters to customize the planet
  var parameters = {
    minRadius : 30,
    maxRadius : 50,
    minSpeed:.015,
    maxSpeed:.025,
    particles:300,
    minSize:.1,
    maxSize:2,
  }

  var scene, renderer, camera, saturn, light;
  
  var WIDTH = window.innerWidth, 
      HEIGHT = window.innerHeight;
      
  var controls;
  
  // initialise the world
  
  function initWorld(){
    //
    // THE SCENE
    scene = new THREE.Scene();
    
    // THE CAMERA
    camera = new THREE.PerspectiveCamera(75, WIDTH/HEIGHT, .1, 2000);
    camera.position.z = 100;
    
    // THE RENDERER
    renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.enabled = true;
    
 
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);  
    
    // LIGHT
    ambientLight = new THREE.AmbientLight(0x663344,2);
    scene.add(ambientLight);
    light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(200,100,200);
    light.castShadow = true;
    light.shadow.camera.left = -400;
    light.shadow.camera.right = 400;
    light.shadow.camera.top = 400;
    light.shadow.camera.bottom = -400;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 1000;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    
    
    scene.add(light);
    
    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    // HANDLE SCREEN RESIZE
    window.addEventListener('resize', handleWindowResize, false);
    // CREATE THE OBJECT
    saturn = new Saturn();
    saturn.mesh.rotation.x = .2;
    saturn.mesh.rotation.z = .2;
    scene.add(saturn.mesh);
    
    // START THE LOOP
    loop();
    
  }
  
  var Saturn = function(){

    //
    // CREATE A MESH
    //
    // A Mesh = Geometry + Material
 
  
    var geomPlanet = new THREE.SphereGeometry(20,32,32);
    

    
     var noise = 1;
    for(var i=0; i<geomPlanet.vertices.length; i++){
      var v = geomPlanet.vertices[i];
    //   v.x += -noise/3 + Math.random()*noise + 2;
    //   v.y += -noise/3 + Math.random()*noise +2;
    //   v.z += -noise/3 + Math.random()*noise + 2;
    theta   = (v.x / 512 * 360 - 180);
    phi     = (v.y / 256 * 180 - 90);
    rho = 20;

    v.x = rho * Math.cos(phi) * Math.cos(theta);
    v.y = rho * Math.cos(phi) * Math.sin(theta);
    v.z = rho * Math.sin(phi);
     
    }
  
    
    // create a new material for the planet
    var matPlanet = getMat(Colors.custom_color1);
    // create the mesh of the planet
    this.planet = new THREE.Mesh(geomPlanet, matPlanet);
  
    this.ring = new THREE.Mesh();
    this.nParticles = 0;
  
    // create the particles to populate the ring
    this.updateParticlesCount();
    
    // Create a global mesh to hold the planet and the ring
  
    this.mesh = new THREE.Object3D();
    this.mesh.add(this.planet);
    this.mesh.add(this.ring);
  
    this.planet.castShadow = true;
    this.planet.receiveShadow = true;
  
    // update the position of the particles => must be moved to the loop
    this.updateParticlesRotation();
  }
  
  Saturn.prototype.updateParticlesCount = function(){
    
    
    if (this.nParticles < parameters.particles){
      
      // Remove particles
      
      for (var i=this.nParticles; i< parameters.particles; i++){
        var p = new Particle();
        p.mesh.rotation.x = Math.random()*Math.PI;
        p.mesh.rotation.y = Math.random()*Math.PI;
        p.mesh.position.y = -2 + Math.random()*4;
        this.ring.add(p.mesh);
      }
    }else{
      
      // add particles
      
      while(this.nParticles > parameters.particles){
        var m = this.ring.children[this.nParticles-1];
        this.ring.remove(m);
        m.userData.po = null;
        this.nParticles--;
      }
    }
    this.nParticles = parameters.particles;
    
    // We will give a specific angle to each particle
    // to cover the whole ring we need to
    // dispatch them regularly
    this.angleStep = Math.PI*2/this.nParticles;
    this.updateParticlesDefiniton();
  }
  
  // Update particles definition
  Saturn.prototype.updateParticlesDefiniton = function(){
    
    for(var i=0; i<this.nParticles; i++){
      var m = this.ring.children[i];
      var s = parameters.minSize + Math.random()*(parameters.maxSize - parameters.minSize);
      m.scale.set(s,s,s);
      
      // set a random distance
      m.userData.distance = parameters.minRadius +  Math.random()*(parameters.maxRadius-parameters.minRadius);
      
      // give a unique angle to each particle
      m.userData.angle = this.angleStep*i;
      // set a speed proportionally to the distance
      m.userData.angularSpeed = rule3(m.userData.distance,parameters.minRadius,parameters.maxRadius,parameters.minSpeed, parameters.maxSpeed);
    }
  }
  
  var Particle = function(){
    // Size of the particle, make it random
    var s = 1;
    
    // geometry of the particle, choose between different shapes
    var geom,
        random = Math.random();
        console.log(random);
  
    if (random<.25){
       // Cube
      geom = new THREE.BoxGeometry(s,s,s);
  
    }else if (random < .5){
      // Pyramid
      geom = new THREE.CylinderGeometry(0,s,s*2, 4, 1);
  
    }else if (random < .75){
      // potato shape
      geom = new THREE.TetrahedronGeometry(s,2);
  
    }else{
      // other plane
      geom = new THREE.BoxGeometry(s/6,s/6,s/6); // other plane
    }
    // color of the particle, make it random and get a material
    var color = getRandomColor();
    var mat = getMat(color);
  
    // create the mesh of the particle
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.userData.po = this;
  }
  
  
  // Update particles position
  Saturn.prototype.updateParticlesRotation = function(){
  
    // increase the rotation of each particle
    // and update its position
  
    for(var i=0; i<this.nParticles; i++){
      var m = this.ring.children[i];
      // increase the rotation angle around the planet
      m.userData.angle += m.userData.angularSpeed;
  
      // calculate the new position
      var posX = Math.cos(m.userData.angle)*m.userData.distance;
      var posZ = Math.sin(m.userData.angle)*m.userData.distance;
      m.position.x = posX;
      m.position.z = posZ;
  
      //*
      // add a local rotation to the particle
      m.rotation.x += Math.random()*.05;
      m.rotation.y += Math.random()*.05;
      m.rotation.z += Math.random()*.05;
      //*/
    }
  }
  
  
  function loop(){
 
    saturn.planet.rotation.y-=.01;
    saturn.updateParticlesRotation();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  
  function handleWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
  }
  
  
  initGUI();
  initWorld();
  
  function initGUI(){
    var gui = new dat.GUI();
    gui.width = 320;
    gui.add(parameters, 'minRadius').min(20).max(60).step(1).name('Inner Radius').onChange(function(){
      saturn.updateParticlesDefiniton();
    });
    gui.add(parameters, 'maxRadius').min(40).max(100).step(1).name('Outer Radius').onChange(function(){
      saturn.updateParticlesDefiniton();
    });
    gui.add(parameters, 'particles').min(50).max(800).step(1).name('No. Asteroids').onChange(function(){
      saturn.updateParticlesCount();
    });
    gui.add(parameters, 'maxSpeed').min(.005).max(0.05).step(.001).name('Increase Speed').onChange(function(){
      saturn.updateParticlesDefiniton();
    });
    gui.add(parameters, 'maxSize').min(.1).max(5).step(.1).name('Increase Size').onChange(function(){
      saturn.updateParticlesDefiniton();
    });;

    var customContainer = document.getElementById('menu');
  customContainer.appendChild(gui.domElement);
  }
  
  function rule3(v,vmin,vmax,tmin, tmax){
    var nv = Math.max(Math.min(v,vmax), vmin);
    var dv = vmax-vmin;
    var pc = (nv-vmin)/dv;
    var dt = tmax-tmin;
    var tv = tmin + (pc*dt);
    return tv;
    
  }