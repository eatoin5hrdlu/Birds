/*
 * line structure definition for scan-line algorithm
 * function declarations 
 * global variable declarations
 * global variable references
 */
struct line
{
  int id, top, start, end, maxlen;
  struct line *next;
};

/* PARSE.C */
void loadImage(char *filename);
void checkImageN(int n);
void checkImage(void);
char * newgetaline(int scanline, int xoffset);

/* PROCESS.C */
void processBlock(int n);
struct line *scan(char *data, int scanline, int width);

/* COMPARE.C */
struct line *comparelines(int scanline, struct line *a, struct line *b);
void merge(struct line *a, struct line *b);

/* READBITMAP.C */
int checkObject(int id, int line, int top, int width, int start);
void showscanline(char *label,struct line *a);

/* GETCROP.C */
void croplayout(char *file, int num);

#ifdef DECLARATIONS
int gMem;

int *gXStart;
int *gYStart;
int *gWidth;
int *gHeight;

int tXStart;
int tYStart;
int tWidth;
int tHeight;

int gTotalBlack;
int gid;
int objects;
int nRows;
int nCols;

int once;

#else

extern int *gXStart;
extern int *gYStart;
extern int *gWidth;
extern int *gHeight;

int tXStart;
int tYStart;
int tWidth;
int tHeight;

extern int gMem;
extern int gTotalBlack;
extern int gid;
extern int objects;
extern int nRows;
extern int nCols;
extern int once;

#endif
