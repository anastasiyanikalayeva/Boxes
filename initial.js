"use strict"
window.onload = function () {

  /**
   * Enabler
   */
  if (Enabler.isInitialized()) {
    init()
  } else {
    Enabler.addEventListener(studio.events.StudioEvent.INIT, init)
  }


  /**
   * Setting Dynamic Profile Id
   */
  function init() {
    if (Enabler.isPageLoaded()) {
      // Enabler.setProfileId(10832456);
      politeInit()
    } else {
      // Enabler.setProfileId(10832456);
      Enabler.addEventListener(studio.events.StudioEvent.PAGE_LOADED, politeInit)
    }
  }


  async function politeInit() {
    const select = (s) => document.querySelector(s)
    const selectAll = (s) => document.querySelectorAll(s)


    /**
     * Exit 
     */
    const clickable = selectAll(".clickable")
    clickable.forEach(element => element.addEventListener("click", function (e) {
      Enabler.exit('Exit')
      return false
    }, false))

    /**
     * Set dynamic
     */
    const wrapper = select('#wrapper')
    const wrect = select('#wrect')
    const ctaWrap = select('#ctaWrap')
    const cta = select('#cta')
    const headline = select("#headline")
    const subheadline = select("#subheadline")

    // const imageWrap = select('#imageWrap')
    // const bgImg = select('#bgImg')
    // const fog = select('#fog')
    // const dc = dynamicContent
    // const dimension = wrect.offsetWidth + "x" + wrect.offsetHeight

    headline.innerHTML = 'MAKE 2X THE IMPACT'
    subheadline.innerHTML = 'Your gift will be MATCHED 2X to provide critical support, supplies and hope to children in need.'
    cta.innerHTML = 'Donate Now'



    /**
     * Preloading images
    */
    // const imagesSrc = [
    //   {
    //     name: 'img1',
    //     src: dc.Image[0][`img_${dimension}`].Url
    //   }
    // ]

    // gsap.set(bgImg, { background: `url(${imagesSrc[0].src}) no-repeat` })

    const loadImages = async (srcsArr) => {
      const imagesArr = await Promise.all(srcsArr.map((img) => {
        return new Promise((resolve) => {
          const image = new Image()

          image.nameImg = img.name
          image.src = img.src
          image.onload = () => resolve(image)
        })
      }))

      const images = imagesArr.reduce((acc, img) => {
        acc[img.nameImg] = img
        return acc
      }, {})

      return images
    }

    // await loadImages(imagesSrc)


    /**
     * Three.js and Cannon.js
     */
    // Canvas
    const canvas = document.querySelector('canvas.webgl')

    // Scene
    const scene = new THREE.Scene()

    /**
     * Textures
     */
    const textureLoader = new THREE.TextureLoader()
    const cubeTextureLoader = new THREE.CubeTextureLoader()

    const environmentMapTexture = cubeTextureLoader.load([
      '/textures/environmentMaps/1/px.png',
      '/textures/environmentMaps/1/nx.png',
      '/textures/environmentMaps/1/py.png',
      '/textures/environmentMaps/1/ny.png',
      '/textures/environmentMaps/1/pz.png',
      '/textures/environmentMaps/1/nz.png'
    ])

    /**
     * Physics
     */

    // World
    const world = new CANNON.World()
    world.broadphase = new CANNON.SAPBroadphase(world)
    world.allowSleep = true
    world.gravity.set(0, -9.82, 0)

    // Materials
    const defaultMaterial = new CANNON.Material('default')

    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.2,
        restitution: 0.1
      }
    )
    world.addContactMaterial(defaultContactMaterial)
    world.defaultContactMaterial = defaultContactMaterial


    // Floor
    const floorShape = new CANNON.Plane()
    const floorBody = new CANNON.Body()
    floorBody.mass = 0
    floorBody.addShape(floorShape)
    floorBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(-1, 0, 0),
      Math.PI * 0.5
    )
    world.addBody(floorBody)

    /**
     * Floor
     */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
      })
    )
    floor.receiveShadow = true
    floor.rotation.x = - Math.PI * 0.5
    scene.add(floor)

    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.set(1024, 1024)
    directionalLight.shadow.camera.far = 15
    directionalLight.shadow.camera.left = - 7
    directionalLight.shadow.camera.top = 7
    directionalLight.shadow.camera.right = 7
    directionalLight.shadow.camera.bottom = - 7
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    /**
     * Sizes
     */
    const sizes = {
      width: 300,
      height: 600
    }

    /**
     * Raycaster
     */
    const raycaster = new THREE.Raycaster()

    /**
     * Mouse
     */
    // const mouse = new THREE.Vector2()
    let mouse = null

    document.addEventListener('mousemove', (event) => {
      mouse = new THREE.Vector2()
      mouse.x = event.clientX / sizes.width * 2 - 1
      mouse.y = -(event.clientY / sizes.height * 2 - 1)
    })

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 15)
    camera.position.set(0, 3, 7)
    scene.add(camera)

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas
    })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor('#262837')
    /**
     * Utils
     */
    const objectsToUpdate = []
    const objectsToTest = []

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
    const createBoxes = (width, height, depth, position) => {

      // Three.js mesh
      const mesh = new THREE.Mesh(boxGeometry, new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture
      }))
      mesh.scale.set(width, height, depth)
      mesh.castShadow = true
      mesh.position.copy(position)
      scene.add(mesh)

      // CANNON.js mesh
      const boxShape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))
      const boxBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 3, 0),
        shape: boxShape,
        material: defaultMaterial
      })
      boxBody.position.copy(mesh.position)
      world.addBody(boxBody)

      // Save in objects to update
      objectsToUpdate.push({
        mesh: mesh,
        body: boxBody
      })
      objectsToTest.push(mesh)
    }

    const createBoxesToCall = () => {
      const random = Math.random() + 0.5
      createBoxes(
        random * 0.5,
        random * 0.5,
        random * 0.5,
        {
          x: 0,
          y: 2,
          z: Math.random() - 0.5 * 3
        }
      )
    }

    const buttonToCreateBoxes = document.querySelector('#button')
    buttonToCreateBoxes.addEventListener('click', createBoxesToCall)
    /**
     * Animate
     */
    const clock = new THREE.Clock()
    let oldElapsedTime = 0

    const tick = () => {
      const elapsedTime = clock.getElapsedTime()
      const deltaTime = elapsedTime - oldElapsedTime
      oldElapsedTime = elapsedTime

      // Update physics world
      world.step(1 / 60, deltaTime, 3)

      for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
      }

      // Cast a ray
      if (mouse) {
        raycaster.setFromCamera(mouse, camera)
      }
      const intersects = raycaster.intersectObjects(objectsToTest)
      for (const object of objectsToTest) {
        object.material.color.set('#ffffff')
      }

      if (intersects.length) {
        intersects[0].object.material.color.set('#22bdef')
      }

      // Render
      renderer.render(scene, camera)

      // Call tick again on the next frame
      window.requestAnimationFrame(tick)
    }

    tick()

    /**
     * Animating
     */


    const tl = gsap.timeline()
    tl
      .to(wrect, { duration: 1, alpha: 0, ease: "none" })

  }
}