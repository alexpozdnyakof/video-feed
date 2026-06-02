local dap = require("dap")

local monorepo = "/Users/aleksandrpozdnakov/Desktop/Work/karma8"

local function get_app_root()
  local cwd = vim.fn.getcwd()
  local app = cwd:match(monorepo .. "/apps/([^/]+)")
  if app then
    return monorepo .. "/apps/" .. app
  end
  return monorepo .. "/apps/videofeed"
end

local root = get_app_root()

dap.configurations["javascript"] = {
  {
    type = "pwa-chrome",
    request = "launch",
    name = "Launch Chrome (Vite) — " .. root,
    url = "http://localhost:5173",
    webRoot = root,
    sourceMaps = true,
    userDataDir = "/tmp/nvim-chrome-debug",
    sourceMapPathOverrides = {
      ["vite:///*"] = root .. "/*",
      ["/*"] = root .. "/*",
      [monorepo .. "/lib/*"] = monorepo .. "/lib/*",
    },
  },
}

for _, lang in ipairs({ "typescript", "javascriptreact", "typescriptreact", "vue" }) do
  dap.configurations[lang] = dap.configurations["javascript"]
end
