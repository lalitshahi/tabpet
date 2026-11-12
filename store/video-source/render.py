import base64, os, subprocess, sys
from playwright.sync_api import sync_playwright
V = sys.argv[1]; FPS = 30
SCENES = [('s1', 6), ('s2', 6), ('s3', 6), ('s4', 8), ('s5', 7), ('s6', 6)]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    pg.goto('http://localhost:8777/index.html'); pg.wait_for_function('window.ready===true')
    for name, dur in SCENES:
        tmp = f'{V}/scenes/{name}.part.mp4'
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                               '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-f', 'mp4', tmp], stdin=subprocess.PIPE)
        for f in range(dur * FPS):
            t = f / FPS
            # fade from paper at the start of every scene except the first, and to paper at the very end
            data = pg.evaluate(f"window.frame('{name}', {t})")
            ff.stdin.write(base64.b64decode(data.split(',', 1)[1]))
        ff.stdin.close()
        if ff.wait() == 0: os.replace(tmp, f'{V}/scenes/{name}.mp4'); print('ok', name, flush=True)
        else: print('FAIL', name, flush=True)
    b.close()
