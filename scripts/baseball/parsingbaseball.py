import requests
from xml.dom import minidom
from cassandra.cluster import Cluster
cluster = Cluster(['localhost'])
session = cluster.connect('goprophet')
import uuid

accessLevel = 't'
version = '4'
year = '2014'
key = 'grnayxvqv4zxsamxhsc59agu'
url = 'http://api.sportsdatallc.org/mlb-' + accessLevel + version + '/rosters/' + year + '.xml?api_key=' + key

def parseNumber(number):
	if (number == ''):
		return None
	else:
		return int(number);

f = requests.get(url).text;
xmlDoc = minidom.parseString(f);

teamList = xmlDoc.getElementsByTagName('team')
for team in teamList:
	teamName = team.attributes['abbr'].value
	playerList = team.getElementsByTagName('player')
	for player in playerList:
		playerAttributes = player.attributes
		playerId = playerAttributes['id'].value
		firstName = playerAttributes['preferred_name'].value
		lastName = playerAttributes['last_name'].value
		fullName = firstName + ' ' + lastName
		position = playerAttributes['position'].value
		uniformNumber = parseNumber(playerAttributes['jersey'].value)
		height = parseNumber(playerAttributes['height'].value)
		weight = parseNumber(playerAttributes['weight'].value)
		print(fullName, teamName)
		session.execute(
        """
        INSERT INTO baseball_player (player_id, full_name, first_name, last_name, team, position, uniform_number, height, weight)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        , (uuid.UUID('{' + playerId + '}'), fullName, firstName, lastName, teamName, position, uniformNumber, height, weight)
      )