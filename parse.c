#include "windows.h"
#include "stdio.h"
#include "stdlib.h"
#include "math.h"
#include "paulslib.h"
#include "line.h"

/*
   Sample program to read a limited number of BMP file types
   Write out lots of diagnostics
   Write out a 24 bit RAW image file
*/

typedef struct {
   unsigned short int type;                 /* Magic identifier            */
   unsigned int size;                       /* File size in bytes          */
   unsigned short int reserved1, reserved2;
   unsigned int offset;                     /* Offset to image data, bytes */
} HEADER;
typedef struct {
   unsigned int size;               /* Header size in bytes      */
   int width,height;                /* Width and height of image */
   unsigned short int planes;       /* Number of colour planes   */
   unsigned short int bits;         /* Bits per pixel            */
   unsigned int compression;        /* Compression type          */
   unsigned int imagesize;          /* Image size in bytes       */
   int xresolution,yresolution;     /* Pixels per meter          */
   unsigned int ncolours;           /* Number of colours         */
   unsigned int importantcolours;   /* Important colours         */
} INFOHEADER;
typedef struct {
   unsigned char r,g,b,junk;
} COLOURINDEX;

#define TABLEBLACK(c)  ((colourindex[d].r|colourindex[d].g|colourindex[d].b)<10)

#ifdef A1
#define BLACK(c)  TABLEBLACK(c)
#else
#define BLACK(c)  (c == 1)
#endif

static char *image = (char *)NULL;
static int dataw;
static int h;
static int w;


COLOURINDEX colourindex[256];

void loadImage(char *filename)
{
   int i,j;
   int gotindex = FALSE;
   unsigned char grey,r,g,b;
   HEADER header;
   INFOHEADER infoheader;
   FILE *fptr;
   gMem = 300;

   /* Open file */
   if ((fptr = fopen(filename,"r")) == NULL) {
      fprintf(stderr,"Unable to open BMP file \"%s\"\n",filename);
      exit(-1);
   }
   gMem = 301;

   /* Read and check the header */

   ReadUShort(fptr,&header.type,FALSE);
#ifdef DEBUG
   fprintf(stderr,"ID is: %d, should be %d\n",header.type,'M'*256+'B');
#endif
   ReadUInt(fptr,&header.size,FALSE);
#ifdef DEBUG
   fprintf(stderr,"File size is %d bytes\n",header.size);
#endif
   ReadUShort(fptr,&header.reserved1,FALSE);
   ReadUShort(fptr,&header.reserved2,FALSE);
   ReadUInt(fptr,&header.offset,FALSE);
#ifdef DEBUG
   fprintf(stderr,"Offset to image data is %d bytes\n",header.offset);
#endif

   /* Read and check the information header */
   if (fread(&infoheader,sizeof(INFOHEADER),1,fptr) != 1) {
      fprintf(stderr,"Failed to read BMP info header\n");
      exit(-1);
   }
#ifdef DEBUG
   fprintf(stderr,"Image size = %d x %d\n",infoheader.width,infoheader.height);
   fprintf(stderr,"Number of colour planes is %d\n",infoheader.planes);
   fprintf(stderr,"Bits per pixel is %d\n",infoheader.bits);
   fprintf(stderr,"Compression type is %d\n",infoheader.compression);
   fprintf(stderr,"Number of colours is %d\n",infoheader.ncolours);
   fprintf(stderr,"Number of required colours is %d\n",
      infoheader.importantcolours);
#endif

   /* Read the lookup table if there is one */
   for (i=0;i<255;i++) {
     colourindex[i].r = 0;
     colourindex[i].g = 0;
     colourindex[i].b = 0;
     colourindex[i].junk = 0;
   }

   if (infoheader.ncolours > 0) {
#ifdef DEBUG
     fprintf(stderr, "There is a color index table\n");
#endif
      for (i=0;i<infoheader.ncolours;i++) {
         if (fread(&colourindex[i].b,sizeof(unsigned char),1,fptr) != 1) {
            fprintf(stderr,"Image read failed\n");
            exit(-1);
         }
         if (fread(&colourindex[i].g,sizeof(unsigned char),1,fptr) != 1) {
            fprintf(stderr,"Image read failed\n");
            exit(-1);
         }
         if (fread(&colourindex[i].r,sizeof(unsigned char),1,fptr) != 1) {
            fprintf(stderr,"Image read failed\n");
            exit(-1);
         }
         if (fread(&colourindex[i].junk,sizeof(unsigned char),1,fptr) != 1) {
            fprintf(stderr,"Image read failed\n");
            exit(-1);
         }
	 /*
        fprintf(stderr,"%3d\t%3d\t%3d\t%3d\n",i,
            colourindex[i].r,colourindex[i].g,colourindex[i].b);
	 */
      }
      gotindex = TRUE;
   }
   else
     {
       printf("No color index table\n");
       exit(0);
     }
   gMem = 302;

   /* Free and/or allocate memory for the bitmap */
   if (image != (char *)NULL) {
#ifdef DEBUG
     fprintf(stderr, "Freeing previous image array\n");
#endif
     free(image);
   }
   gMem = 303;
   /* Set the *global* dimensions for future reference   */
   /* width (w) may not be a multiple of 4, but dataw is */

   h = infoheader.height;
   dataw = w = infoheader.width;
   dataw += (w%4) ? 4-(w%4) : 0;

   //   printf("height = %d dataw=%d\n", h,dataw);
   image = (unsigned char *)malloc((h+1)*(dataw+1));
   //   printf("H %d W %d HXW %d\n", h, w, h*dataw);
   //   printf("IMAGE %x (%d) %x\n", image, (h+1)*(dataw+1), image+((h+1)*(dataw+1)));
   gMem = 304;

   /* Seek to the start of the image data */
   fseek(fptr,header.offset,SEEK_SET);

   /* Read each image line, and set each byte to white(0) or black(1) */
   for (j=0;j<h;j++) {
     gMem = 10000;
     unsigned char *line = &image[j*dataw];
     if (fread(line,sizeof(unsigned char),dataw,fptr) != dataw)
       {
	 fprintf(stderr,"Image read failed scanning line %d of %d\n",j,h);
	 exit(-1);
       }
#ifdef A1

#else
     for (i=0;i<w;i++)
       {
	 int d = line[i];
	 if (TABLEBLACK(d))
	   line[i] = 1;
	 else
	   line[i] = 0;
       }
#endif
   }
   fclose(fptr);
   gMem = 30000;
}

char * newgetaline(int scanline, int xoffset)
{
  /*
  printf("SCANLINE %d\n", scanline);
  printf("NEWGETALINE %x %d %d %d\n", image, scanline, dataw, xoffset);
  */
  return &image[scanline*dataw + xoffset];
  /*  printf("ADDRESS %x\n", tmp); */
}

void checkImage(void)
{
   printf("  |");
   int i,j;
   for (j=0;j<h;j++) {
     unsigned char *line = newgetaline(j,0);
      for (i=0;i<w;i++) {

	int d = line[i];
	if (i%2) { if ( BLACK(d) ) printf("@"); else printf(" "); }
      }
      printf("|\n  |");
   }
}

extern int *gXStart;
extern int *gYStart;
extern int *gWidth;
extern int *gHeight;
extern int show;

void checkImageN(int n)
{
  int minx, maxx, miny, maxy;
  int i,j;
  if (show != n+1) return;
      /* Get the Bounding Box for this Cropping */

      minx = *(gXStart+n);
      maxx = minx + *(gWidth+n);
      miny = *(gYStart+n);
      maxy = miny + *(gHeight+n);

      printf("\n  [%3d ]|",n+1);
      for (i=minx;i<maxx;i+=2) { printf("_"); }
      printf("\n        |");

      for (j=maxy-1;j>=miny;j--)
	{
	  if (j%2) continue;
	  unsigned char *line = newgetaline(j,0);
	  for (i=minx;i<maxx;i++)
	    {
	      int d = line[i];
	      if (i%2) {
		if ( BLACK(d) ) printf("@"); else printf(" ");
	      }
	    }
	  printf("|\n%3d %3d |",j-miny, (maxy-j));
	}
      for (i=minx;i<maxx;i+=2) { printf("_"); } printf("\n");
}






