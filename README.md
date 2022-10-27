# ddc-source-copilot

Copilot completion for ddc.vim

NOTE: It is experimental source.


## Required

### copilot.vim

https://github.com/github/copilot.vim

### denops.vim

https://github.com/vim-denops/denops.vim

### ddc.vim

https://github.com/Shougo/ddc.vim

### getcmdcompltype() support

## Configuration

```vim
let g:copilot_enabled = v:false
let g:copilot_no_maps = v:true

" Use input source.
call ddc#custom#patch_global('sources', ['copilot'])

" Change source options
call ddc#custom#patch_global('sourceOptions', {
      \   'input': {
      \     'mark': 'copilot',
      \     'matchers': [],
      \     'minAutoCompleteLength': 0,
      \   }
      \ })
```
