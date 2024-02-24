local api = require("copilot.api")
local util = require("copilot.util")

local M = {}

--- Get Copilit client
--- @return lsp.Client | nil
local function get_client()
  for _, client in ipairs(vim.lsp.get_clients({ name = "copilot" })) do
    if client.name == "copilot" then
      return client
    end
  end
  return nil
end

--- Split by line
--- @param str string
--- @return string[]
local function split_line(str)
  local result = {}
  for line in string.gmatch(str, "[^\r\n]+") do
    table.insert(result, line)
  end
  return result
end

--- @class Suggestion
--- @field displayText string
--- @field position { character: number; line: number }
--- @field range { start: { character: number; line: number }; end: { character: number; line: number } }
--- @field text string
--- @field uuid string

--- @class CompletionMetaData
--- @field word string

--- @class CompletionItem
--- @field word string
--- @field info string[]
--- @field user_data CompletionMetaData

--- Format completion item
--- @param complete_pos number
--- @return fun(item: Suggestion): CompletionItem
local function format(complete_pos)
  return function(item)
    local indent = string.match(item.text, "^%s*")
    local info = indent ~= nil
        and vim.tbl_map(function(line)
            return string.sub(line, string.len(indent) + 1)
          end,
          split_line(item.text)
        )
        or item.text

    return {
      word = string.sub(split_line(item.text)[1], complete_pos + 1),
      info = info,
      user_data = {
        word = item.text,
      },
    }
  end
end

--- Update completion items
--- @param name string
--- @param complete_pos number
M.update_items = function(name, complete_pos)
  local client = get_client()
  if client == nil then
    return
  end
  api.get_completions(client, util.get_doc_params(), function(err, response)
    if err or not response or not response.completions then
      return
    end
    local completion_items = vim.tbl_map(format(complete_pos), response.completions)
    vim.fn["ddc#update_items"](name, completion_items)
  end)
end

return M
