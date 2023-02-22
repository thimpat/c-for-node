//+---------------------------------------------------------------------------
//
//  dll.c - Windows DLL example - dynamically linked part
//

#include <windows.h>
#include "fib.h"

__declspec(dllexport) const char *hello_data = "(not set)";

__declspec(dllexport) char* hello_func (char* name)
{
    char str[100];
    int aa = fib(5);
    sprintf(str, "From DLL: %d - %s", aa, name);
    MessageBox (0, hello_data, str, MB_ICONINFORMATION);
    return "All okay";
}
