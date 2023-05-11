# ddc-source-copilot

Copilot completion for ddc.vim

NOTE: It is based on "ddc-copilot".

https://github.com/yuki-yano/ddc-copilot

## Required

### copilot.vim

https://github.com/github/copilot.vim

### denops.vim

https://github.com/vim-denops/denops.vim

### ddc.vim

https://github.com/Shougo/ddc.vim

## Configuration

```vim
let g:copilot_no_maps = v:true

call ddc#custom#patch_global('sources', ['copilot'])

call ddc#custom#patch_global('sourceOptions', #{
      \   copilot: #{
      \     mark: 'copilot',
      \     matchers: [],
      \     minAutoCompleteLength: 0,
      \   }
      \ })
```
