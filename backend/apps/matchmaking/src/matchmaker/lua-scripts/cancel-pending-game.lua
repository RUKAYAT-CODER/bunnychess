--[[
  Cancel pending game and reset player status if player is still waiting for the game.

  Input:
    KEYS[1] pending game key
    KEYS[2] key that holds account id 0 status
    KEYS[3] key that holds account id 1 status

    ARGV[1] pending game id to delete

  Output:
    1 - pending game deleted
    0 - pending game not deleted (non existent or already deleted)
]]

local pendingGameKey = KEYS[1]
local accountId0StatusKey = KEYS[2]
local accountId1StatusKey = KEYS[3]
local pendingGameId = ARGV[1]

local deleted = redis.call('DEL', pendingGameKey)

for _, statusKey in ipairs({accountId0StatusKey, accountId1StatusKey}) do
  local status, gameId = unpack(redis.call('HMGET', statusKey, 'status', 'gameId'))
  -- Only reset status if player is still waiting for current pendingGameId
  if status == 'pending' and gameId == pendingGameId then
    redis.call('DEL', statusKey)
  end
end

return deleted
