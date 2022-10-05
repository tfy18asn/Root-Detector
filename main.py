from backend.app import App
from backend.cli import CLI

if __name__ == '__main__':
    ok = CLI.run()

    if not ok:
        #start UI
        print('Starting UI')
        App().run(parse_args=False, host="130.239.221.24", port=80, debug=True)

