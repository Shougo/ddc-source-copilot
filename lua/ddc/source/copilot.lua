local api = require("copilot.api")
local util = require("copilot.util")
local client = require("copilot.client")

local M = {}

--- Update completion items
--- @param name string
--- @param lambda_id string
M.update_items = function(name, lambda_id)
  local c = client.get()
  if c == nil then
    return
  end
  api.get_completions(c, util.get_doc_params(), function(err, response)
    if err or not response or not response.completions or #response.completions == 0 then
      return
    end
    vim.fn["denops#notify"](name, lambda_id, { response.completions })
  end)
end

return M
