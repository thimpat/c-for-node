##shebang##
// ---------------------------------------------------------------------------
// Function caller
// ---------------------------------------------------------------------------
//

#include <windows.h>

char* hello_func (void);
__declspec(dllimport) extern const char *hello_data;

int WINAPI WinMain(
    HINSTANCE hInstance,
    HINSTANCE hPrevInstance,
    LPSTR     lpCmdLine,
    int       nCmdShow)
{
    hello_data = "Hello World!";
    ##invokation##;
    return 0;
}
