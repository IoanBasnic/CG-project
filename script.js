function getMat(color){
    return new THREE.MeshStandardMaterial({
      color:color,
      roughness:.7,
      emissive:0x270000,
      shading:THREE.FlatShading
    });
  }
  // colors
  var Colors = {
    custom_color1 : 0xE51E2B,
    custom_color2 : 0xD4173F,
    custom_color3 : 0x050B2B,
    custom_color4 : 0x495B53
  }

  var colorsLength = Object.keys(Colors).length;
  function getRandomColor(){
    var colIndx = Math.floor(Math.random()*colorsLength);
    var colorStr = Object.keys(Colors)[colIndx];
    return Colors[colorStr];
  }
  
  // parameters to customize the planet
  var parameters = {
    minRadius : 50,
    maxRadius : 100,
    minSpeed: .01,
    maxSpeed:.025,
    asteroids:30,
    minSize:.1,
    maxSize:2,
  }

  var scene, renderer, camera, planet, light;
  
  var WIDTH = window.innerWidth, 
      HEIGHT = window.innerHeight;
      
  var controls;
  
  // initialise the world
  
  function initPlanet(){
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
    light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(200,100,200);
    light.castShadow = true;
    light.shadow.camera.left = -800;
    light.shadow.camera.right = 800;
    light.shadow.camera.top = 800;
    light.shadow.camera.bottom = -800;
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
    planet = new Planet();
    planet.mesh.rotation.x = .2;
    planet.mesh.rotation.z = .2;
    scene.add(planet.mesh);
    // START THE LOOP
    loop();
  }
  
  var Planet = function(){
    //
    // CREATE A MESH
    //
    // A Mesh = Geometry + Material
    var geomPlanet = new THREE.SphereGeometry(20,32,32);
     var noise = 5;
     var radius = 20;
    for(var i=0; i<geomPlanet.vertices.length; i++){
      var v = geomPlanet.vertices[i];
    theta   = (v.x / 512 * 360 - 180);
    phi     = (v.y / 256 * 180 - 90);
    v.x = radius * Math.cos(phi) * Math.cos(theta) + noise;
    v.y = radius * Math.cos(phi) * Math.sin(theta) + noise;
    v.z = radius * Math.sin(phi) + noise;
    }
    var matPlanet = getMat(Colors.custom_color3);
    this.planet = new THREE.Mesh(geomPlanet, matPlanet);
  
    this.ring = new THREE.Mesh();
    this.nParticles = 0;
    this.updateParticlesCount();
    this.mesh = new THREE.Object3D();
    this.mesh.add(this.planet);
    this.mesh.add(this.ring);
  
    this.planet.castShadow = true;
    this.planet.receiveShadow = true;
    this.updateParticlesRotation();
  }
  
  Planet.prototype.updateParticlesCount = function(){
    if (this.nParticles < parameters.asteroids){
      for (var i=this.nParticles; i< parameters.asteroids; i++){
        var p = new Particle();
        p.mesh.rotation.x = Math.random()*Math.PI;
        p.mesh.rotation.y = Math.random()*Math.PI;
        p.mesh.position.y = -2 + Math.random()*4;
        this.ring.add(p.mesh);
      }
    }else{
      while(this.nParticles > parameters.asteroids){
        var m = this.ring.children[this.nParticles-1];
        this.ring.remove(m);
        m.userData.po = null;
        this.nParticles--;
      }
    }
    this.nParticles = parameters.asteroids;
    this.angleStep = Math.PI*2/this.nParticles;
    this.updateParticlesDefiniton();
  }
  
  Planet.prototype.updateParticlesDefiniton = function(){
    
    for(var i=0; i<this.nParticles; i++){
      var s = parameters.minSize + Math.random()*(parameters.maxSize - parameters.minSize);
      this.ring.children[i].scale.set(s,s,s);
      this.ring.children[i].userData.distance = parameters.minRadius +  Math.random()*(parameters.maxRadius-parameters.minRadius);
      this.ring.children[i].userData.angle = this.angleStep*i;
      this.ring.children[i].userData.angularSpeed = rule3(this.ring.children[i].userData.distance,parameters.minRadius,parameters.maxRadius,parameters.minSpeed, parameters.maxSpeed);
    }
  }
  
  var Particle = function(){
    var s = 1;
    var geom,
        random_number = Math.random();
       // console.log(random);
    if (random_number <.30){
      geom = new THREE.TorusGeometry(s, s/3, s*4, 100)
    }else if (random_number < .60){
      geom = new THREE.CylinderGeometry(0,s*2,s*3, 4, 1);
  
    }else if (random_number < .80){
      geom = new THREE.TetrahedronGeometry(s*2,s);
  
    }else{
      geom = new THREE.SphereGeometry(s/2,s/4,s/6);
    }
    var color = getRandomColor();
    var mat = getMat(color);
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.userData.po = this;
  }
  
  
  Planet.prototype.updateParticlesRotation = function(){
  
    for(var i=0; i<this.nParticles; i++){
      var m = this.ring.children[i];
      m.userData.angle += m.userData.angularSpeed;
  
      var posX = Math.cos(m.userData.angle)*m.userData.distance;
      var posZ = Math.sin(m.userData.angle)*m.userData.distance;
      m.position.x = posX;
      m.position.z = posZ;
  
      m.rotation.x += Math.random()*.05;
      m.rotation.y += Math.random()*.05;
      m.rotation.z += Math.random()*.05;
      
    }
  }
  
  
  function loop(){
 
    planet.planet.rotation.y-=.01;
    planet.updateParticlesRotation();
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
  initPlanet();
  
  function initGUI(){
    var gui = new dat.GUI();
    gui.width = 320;
    gui.add(parameters, 'minRadius').min(10).max(150).step(1).name('Inner Limit').onChange(function(){
      planet.updateParticlesDefiniton();
    });
    gui.add(parameters, 'maxRadius').min(60).max(300).step(1).name('Outer Limit').onChange(function(){
      planet.updateParticlesDefiniton();
    });
    gui.add(parameters, 'asteroids').min(10).max(800).step(1).name('No. Asteroids').onChange(function(){
      planet.updateParticlesCount();
    });
    gui.add(parameters, 'maxSpeed').min(0.01).max(0.05).step(.001).name('Increase Speed').onChange(function(){
      planet.updateParticlesDefiniton();
    });
    gui.add(parameters, 'maxSize').min(.1).max(5).step(.1).name('Increase Size').onChange(function(){
      planet.updateParticlesDefiniton();
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