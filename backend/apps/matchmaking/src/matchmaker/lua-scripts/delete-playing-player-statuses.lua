--[[
  Delete statuses only if players are still playing the provided game id.

  Input:
    KEYS[1] key that holds account id 0 status
    KEYS[2] key that holds account id 1 status

    ARGV[1] game id

  Output:
    0/1/2 - number of deleted statuses
]]

local accountId0StatusKey = KEYS[1]
local accountId1StatusKey = KEYS[2]
local providedGameId = ARGV[1]

local deleted = 0

for _, statusKey in ipairs({accountId0StatusKey, accountId1StatusKey}) do
  local status, gameId = unpack(redis.call('HMGET', statusKey, 'status', 'gameId'))
  -- Only reset status if player is still playing provided game id
  if status == 'playing' and providedGameId == gameId then
    deleted = deleted + redis.call('DEL', statusKey)
  end
end

return deleted
