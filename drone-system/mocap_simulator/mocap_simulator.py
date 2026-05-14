import asyncio
import websockets
import json
import time
import os

# 获取项目根目录的绝对路径
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# 数据文件路径
JSON_PATH = os.path.join(PROJECT_ROOT, 'public', 'new_mocap_data.json')

# 帧间隔时间（秒）
FRAME_INTERVAL = 0.01  # 10ms


async def send_motion_data(websocket, path):
    """
    入口处理函数，读取动捕数据并持续发送
    """
    try:
        with open(JSON_PATH, 'r') as f:
            motion_data = json.load(f)
            print(f"Loaded motion data from: {JSON_PATH}")

            # 数据基本信息
            frame_count = len(motion_data)
            first_frame = motion_data[0] if frame_count > 0 else {}
            last_frame = motion_data[-1] if frame_count > 0 else {}

            print(f"Found {frame_count} frames")
            print(f"Frame range: {first_frame.get('FrameNo', 'N/A')} - {last_frame.get('FrameNo', 'N/A')}")
            print(f"Time range: {first_frame.get('TimeStamp', 'N/A')} - {last_frame.get('TimeStamp', 'N/A')}")

            # 分析标记集信息
            if frame_count > 0:
                markerset_names = set()
                max_markersets = 0
                min_markersets = float('inf')

                for frame in motion_data:
                    markersets = frame.get('MarkerSets', [])
                    max_markersets = max(max_markersets, len(markersets))
                    min_markersets = min(min_markersets, len(markersets))

                    for ms in markersets:
                        markerset_names.add(ms.get('Name', 'Unknown'))

                print(f"Found {len(markerset_names)} unique MarkerSet types: {', '.join(sorted(markerset_names))}")
                print(f"MarkerSets per frame: min={min_markersets}, max={max_markersets}")

                # 示例检查一些标记点
                sample_frame = motion_data[0]
                print("\nSample frame structure:")
                for i, ms in enumerate(sample_frame.get('MarkerSets', [])):
                    markers = ms.get('Markers', [])
                    print(f"  MarkerSet #{i + 1}: {ms.get('Name', 'Unknown')} with {len(markers)} markers")

        # 持续发送帧数据的循环
        frame_index = 0
        next_frame_time = time.monotonic()

        print("\nMotion capture simulator is actively sending data...")
        print("Press Ctrl+C to stop")

        while True:
            now = time.monotonic()
            if now >= next_frame_time:
                # 获取当前帧数据
                current_frame = motion_data[frame_index]

                # 每十帧记录一次详细信息
                if frame_index > 0 and frame_index % 10 == 0:
                    frame_no = current_frame.get('FrameNo', 'Unknown')
                    timestamp = current_frame.get('TimeStamp', 'Unknown')
                    marker_sets = current_frame.get('MarkerSets', [])

                    markerset_info = []
                    for ms in marker_sets:
                        markerset_info.append(f"{ms.get('Name', 'Unknown')}({len(ms.get('Markers', []))})")

                    print(f"Frame {frame_index} (ID: {frame_no}, Time: {timestamp}): " +
                          f"{len(marker_sets)} MarkerSets: {', '.join(markerset_info)}")

                # 直接发送原始帧数据
                await websocket.send(json.dumps(current_frame))

                # 输出详细信息
                dt = now - (next_frame_time - FRAME_INTERVAL)
                print(f"Frame {frame_index} sent, interval: {dt * 1000:.3f}ms")

                # 循环使用帧数据
                frame_index = (frame_index + 1) % len(motion_data)

                # 更新下一帧发送时间
                next_frame_time += FRAME_INTERVAL
            else:
                # 如果提前，等待直到下一帧应发送的时刻
                await asyncio.sleep(next_frame_time - now)

    except Exception as e:
        print(f"Error in motion data sending: {e}")
    finally:
        print("Client disconnected")


async def main():
    print("Starting motion capture simulator...")
    print(f"Using motion data from: {JSON_PATH}")

    # 检查文件是否存在
    if not os.path.exists(JSON_PATH):
        print(f"Error: Motion data file not found at {JSON_PATH}")
        return

    server = await websockets.serve(
        send_motion_data,
        "0.0.0.0",  # 允许所有IP访问
        8765
    )

    print("\nMotion capture simulator running!")
    print("WebSocket server URL: ws://localhost:8765")
    print("\nPress Ctrl+C to stop the server")

    try:
        await server.wait_closed()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.close()
        await server.wait_closed()
        print("Server stopped")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user")