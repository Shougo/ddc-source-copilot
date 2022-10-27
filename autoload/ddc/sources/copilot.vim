function! ddc#sources#copilot#callback()
  if !exists('*copilot#Complete')
    return
  endif

  echomsg 'callback'
  try
    call copilot#Complete(function('s:Handler'), function('s:Handler'))
  catch
    call copilot#logger#Exception()
  endtry
endfunction

function! s:Handler(result) abort
  if !exists('b:_copilot')
    return
  endif

  let completions = get(a:result, 'completions', [])
  call ddc#update_items('copilot', map(copy(completions), { _, val -> {
        \     'word': val.displayText,
        \   }
        \ }))
endfunction
