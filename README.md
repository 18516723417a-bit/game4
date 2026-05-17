# Game4 City Racer

轻量浏览器端 3D 城市驾驶原型。当前阶段只包含：

- Vite + React + React Three Fiber 客户端
- Node.js + WebSocket 服务端骨架
- 一个简单城市道路场景
- 一辆可驾驶的低模车辆
- 预留大地图、chunk 分区加载、联机同步、瞬移点扩展结构

## 运行

```bash
cd /home/ubuntu/game4
npm install
npm run dev
```

默认地址：

- Client: http://localhost:5173/game4/
- Server: http://localhost:3001
- Health: http://localhost:3001/health
- WebSocket: ws://localhost:3001/ws
- Nginx production path: https://crx.fengche.ai/game4/

只运行客户端：

```bash
npm run dev:client
```

只运行服务端：

```bash
npm run dev:server
```

生产构建客户端：

```bash
npm run build
```

## Ubuntu + Nginx 部署

当前生产路径是 `/game4/`，Vite 的 `base` 已配置为 `/game4/`，构建输出目录为 `client/dist`。

```bash
cd /home/ubuntu/game4
npm install
npm run build
sudo cp deploy/game4-server.service /etc/systemd/system/game4-server.service
sudo systemctl daemon-reload
sudo systemctl enable --now game4-server.service
sudo nginx -t
sudo systemctl reload nginx
```

验证：

```bash
curl -I https://crx.fengche.ai/game4/
ASSET=$(find client/dist/assets -name '*.js' -printf '%f\n' | head -n 1)
curl -I "https://crx.fengche.ai/game4/assets/$ASSET"
curl https://crx.fengche.ai/game4/health
```

## 当前控制

- `W` / `ArrowUp`: 加速
- `S` / `ArrowDown`: 刹车/倒车
- `A` / `ArrowLeft`: 左转
- `D` / `ArrowRight`: 右转
- `R`: 回到出生点

## 单人车辆驾驶

- 车辆参数在 `client/src/features/vehicle/vehicleConfig.js`
- 控制和简单物理在 `client/src/features/vehicle/vehicleController.js`
- React Three Fiber 渲染接入在 `client/src/features/vehicle/PlayerCar.jsx`
- 第三人称相机在 `client/src/features/camera/ChaseCamera.jsx`

当前基础参数包括：

- `acceleration`
- `brakeForce`
- `maxSpeed`
- `turnSpeed`
- `friction`

## 扩展方向

- `client/src/features/world`: 地图、chunk、道路、建筑
- `client/src/features/vehicle`: 车辆输入、车辆表现、轻量运动模型
- `client/src/features/camera`: 第三人称跟随摄像机
- `server/src/protocol.js`: 后续联机消息协议
- `server/src/index.js`: 后续房间、玩家状态同步、快照广播入口
