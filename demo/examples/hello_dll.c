//+---------------------------------------------------------------------------
//
//  HELLO_DLL.C - Windows DLL example - main application part
//

#include <windows.h>

char* hello_func (char*);
__declspec(dllimport) extern const char *hello_data;

int WINAPI WinMain(
    HINSTANCE hInstance,
    HINSTANCE hPrevInstance,
    LPSTR     lpCmdLine,
    int       nCmdShow)
{
    hello_data = "Hello World!";
    hello_func("Hi you!");
    return 0;
}
