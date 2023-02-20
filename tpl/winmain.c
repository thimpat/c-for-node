##shebang##
// ---------------------------------------------------------------------------
// Function caller
// ---------------------------------------------------------------------------
#include <stdio.h>
#include <windows.h>

#define FILE_NAME "##fileSharingPath##"


##cFunctionPrototype##;
__declspec(dllimport) extern const char *hello_data;

void write_result(char *str)
{
    char *filename = FILE_NAME;
    FILE *fp       = fopen(filename, "w");
    if (fp == NULL)
    {
        printf("Error opening the file %s", filename);
        return -1;
    }

    fprintf(fp, "%s", str);

    fclose(fp);
}

int WINAPI WinMain(
    HINSTANCE hInstance,
    HINSTANCE hPrevInstance,
    LPSTR     lpCmdLine,
    int       nCmdShow)
{
    hello_data = "Hello World!";
    void* result = (void*)##cFunctionInvokation##;
    write_result((char*)result);
    return 0;
}
