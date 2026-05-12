import urllib.request, json, urllib.error  
req = urllib.request.Request('http://localhost:8080/api/predictions', method='POST', headers={'Content-Type': 'application/json'}, data=json.dumps({'region': 'Tamil Nadu', 'crop': 'Rice', 'season': 'Kharif', 'soilType': 'Alluvial', 'temperature': 29.1, 'humidity': 65.7, 'rainfall': 1.5}).encode('utf-8'))  
try:  
  print(urllib.request.urlopen(req).read().decode())  
except Exception as e:  
  print(e)  
  if hasattr(e, 'read'): print(e.read().decode())  
