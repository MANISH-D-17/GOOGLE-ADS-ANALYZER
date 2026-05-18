"""
Method: POST
Endpoint: https://api.dataforseo.com/v3/on_page/uncrawlable_resources
@see https://docs.dataforseo.com/v3/on_page/uncrawlable_resources/
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from lib.client import RestClient
from lib.config import username, password
client = RestClient(username, password)

post_data = []
post_data.append({
        'id': '04291510-1153-0216-0000-e93585f02a41'
    })
try:
    response = client.post('/v3/on_page/uncrawlable_resources', post_data)
    print(response)
    # do something with post result
except Exception as e:
    print(f'An error occurred: {e}')
