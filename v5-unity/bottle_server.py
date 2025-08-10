# Lightweight JavaScript Tutor server

# NOTE that this is meant only for testing and not deployment, since
# there is no sandboxing

# to invoke, run 'python bottle_server.py'
# and visit http://localhost:8003/visualize.html
#
# external dependencies: bottle
#
# easy_install pip
# pip install bottle

from bottle import route, get, request, run, template, static_file
import os


@route('/web_exec_<name:re:.+>.py')
@route('/LIVE_exec_<name:re:.+>.py')
@route('/viz_interaction.py')
@route('/syntax_err_survey.py')
@route('/runtime_err_survey.py')
@route('/eureka_survey.py')
@route('/error_log.py')
def dummy_ok(name=None):
    return 'OK'

@route('/<filepath:path>')
def index(filepath):
    return static_file(filepath, root='.')


# JavaScript/TypeScript execution is handled by the cokapi backend
# These routes just serve as placeholders for the frontend


if __name__ == "__main__":
    if os.environ.get('APP_LOCATION')=='heroku':
        run(host='0.0.0.0', port=int(os.environ.get("PORT",5000)), reloader=True)
    else:
        # Bind to 0.0.0.0 for Docker container accessibility
        run(host='0.0.0.0', port=8003, reloader=True)
