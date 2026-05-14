<!-- src/components/ThreeScene.vue -->
<template>
  <div ref="container" class="three-container"></div>
</template>

<script>
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default {
  name: 'ThreeScene',

  props: {
    isPlaying: {
      type: Boolean,
      default: false
    },
    isPaused: {
      type: Boolean,
      default: true
    }
  },

  emits: ['updateCoordinates'],

  setup() {
    const container = ref(null);
    let scene, camera, renderer, controls;
    let spheres = [];

    const initScene = () => {
      // 场景初始化
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 1, 100000);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      
      renderer.setSize(container.value.clientWidth, container.value.clientHeight);
      container.value.appendChild(renderer.domElement);
      
      // 设置场景
      renderer.setClearColor(0xffffff);
      camera.up.set(0, 0, 1);
      camera.position.set(3500, 3500, 3500);
      camera.lookAt(0, 0, 0);

      // 添加坐标系和网格
      const axesHelper = new THREE.AxesHelper(10000);
      axesHelper.position.set(0, 0, -2000); 
      scene.add(axesHelper);

      // 增大立方体尺寸
      const boxGeometry = new THREE.BoxGeometry(4000, 4000, 4000);
      const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFE5E5E5 });
      const boxWireframe = new THREE.LineSegments(edgesGeometry, lineMaterial);
      boxWireframe.position.set(0, 0, 0);
      scene.add(boxWireframe);

      // 调整网格大小
      const gridHelper = new THREE.GridHelper(4000, 40, 0xFFE5E5E5, 0xFFE5E5E5);
      gridHelper.rotation.x = Math.PI / 2;
      gridHelper.position.set(0, 0, -2000);
      scene.add(gridHelper);

      // 初始化控制器
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = true;
      controls.autoRotate = false;

      // 创建球体
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const positions = ['center', 'marker1', 'marker2', 'marker3', 'marker4'];
      positions.forEach(() => {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(20, 32, 32),
          sphereMaterial.clone()
        );
        scene.add(sphere);
        spheres.push(sphere);
      });

      // 响应容器大小变化
      const resizeObserver = new ResizeObserver(() => {
        if (container.value) {
          camera.aspect = container.value.clientWidth / container.value.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.value.clientWidth, container.value.clientHeight);
        }
      });
      resizeObserver.observe(container.value);
    };

    // 检查并更新球体颜色
    const updateSphereColor = (sphere, x, y, z) => {
      if (x > 2000 || x < -2000 || 
          y > 2000 || y < -2000 || 
          z > 4000 || z < 0) {
        sphere.material.color.set(0xff0000);
      } else {
        sphere.material.color.set(0x888888);
      }
    };

    // 更新所有球体位置的函数
    const updateSpherePositions = (coordinates) => {
      if (!spheres.length || !coordinates) return;

      const offsetZ = -2000; // Z轴偏移量
      
      // 更新中心球体位置
      if (coordinates.position) {
        const [x, y, z] = coordinates.position;
        spheres[0].position.set(x, y, z + offsetZ);
        updateSphereColor(spheres[0], x, y, z);
      }

      // 更新标记点位置
      if (coordinates.markers) {
        const markers = [
          coordinates.markers.Marker1,
          coordinates.markers.Marker2,
          coordinates.markers.Marker3,
          coordinates.markers.Marker4
        ];

        markers.forEach((marker, index) => {
          if (marker) {
            const [x, y, z] = marker;
            spheres[index + 1].position.set(x, y, z + offsetZ);
            updateSphereColor(spheres[index + 1], x, y, z);
          }
        });
      }

      // 刷新场景
      renderer.render(scene, camera);
    };

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    // 监听坐标更新事件
    const handleCoordinateUpdate = (event) => {
      const coordinates = event.detail.coordinates;
      updateSpherePositions(coordinates);
    };

    onMounted(() => {
      initScene();
      animate();
      window.addEventListener('coordinate-update', handleCoordinateUpdate);
    });

    onUnmounted(() => {
      window.removeEventListener('coordinate-update', handleCoordinateUpdate);
      if (renderer) {
        renderer.dispose();
      }
      if (controls) {
        controls.dispose();
      }
    });

    return {
      container
    };
  }
};
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 0.5vw;
}
</style>