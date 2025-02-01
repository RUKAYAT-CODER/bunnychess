--[[
  Accept a pending match request on behalf of provided account id.

  Input:
    KEYS[1] pending game key

    ARGV[1] id of the account that accepted the match

  Output:
    nil - could not find pending game or account id already accepted
    string - stringified JSON object representing the updated pending game
]]

local pendingGameKey = KEYS[1]
local accountId = ARGV[1]

local encodedPendingGame = redis.call('GET', pendingGameKey)
if encodedPendingGame == false then
  return nil
end
local pendingGame = cjson.decode(encodedPendingGame)
-- If accountId already accepted, do nothing
if pendingGame[accountId] ~= 0 then
  return nil
end

pendingGame[accountId] = 1
encodedPendingGame = cjson.encode(pendingGame)
-- Do not reset TTL, countdown must continue
redis.call('SET', pendingGameKey, encodedPendingGame, 'KEEPTTL')

return encodedPendingGame
