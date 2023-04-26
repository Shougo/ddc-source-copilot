function! ddc#sources#copilot#callback()
  try
    call copilot#Complete('s:Handler'->function(), 's:Handler'->function())
  catch
    call copilot#logger#Exception()
  endtry
endfunction

function! s:Handler(result) abort
  if !('b:_copilot'->exists())
    return
  endif

  let completions = a:result->get('completions', [])
  call ddc#update_items('copilot', completions->copy()->map(
        \ { _, val -> #{ word: val.displayText, } }))
endfunction
