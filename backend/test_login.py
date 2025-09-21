import json
import urllib.request

url = 'http://localhost:8000/api/auth/login'
body = json.dumps({'login':'admin','password':'admin'}).encode('utf-8')
req = urllib.request.Request(url, data=body, headers={'Content-Type':'application/json'})
res = urllib.request.urlopen(req)
print(res.read().decode())
