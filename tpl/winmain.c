##shebang##
// ---------------------------------------------------------------------------
// Function caller
// ---------------------------------------------------------------------------

#include <windows.h>

##cFunctionPrototype##;
__declspec(dllimport) extern const char *hello_data;

int WINAPI WinMain(
    HINSTANCE hInstance,
    HINSTANCE hPrevInstance,
    LPSTR     lpCmdLine,
    int       nCmdShow)
{
    hello_data = "Hello World!";
    ##cFunctionInvokation##;
    return 0;
}
