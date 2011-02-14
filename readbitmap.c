#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>

#define DECLARATIONS
#include "line.h"            /* Global Variables */
static const char* iview = "C:/cygwin/bin/i_view32.exe";

int gBlank;
int gBlotsize;
int gHeld;

/* Read a Bitmap File */

static int bytesPerPixel;
static int gReject[10];
static int gNoise[10];
static char *gNoiseStr[5];
static int colors[256];
static char thisfile[1024];
static char cmd[2048];

void handler(int signum)
{
  printf("sig(%d) gMem = %d\n",signum, gMem);
  exit(0);
}

void inthandler(int signum)
{
  printf("goodbye\n");
  exit(0);
}

#include <sys/stat.h>
int exists(char *filename)
{
  struct stat mystat;
  return !stat(filename,&mystat);
}

/* Only one object counted for "connected" shapes */
static int unique[50];
static int uc,ic;
void resetUnique(void)
{
  for(ic=0;ic<50;ic++) unique[ic] = 0;
  uc = 0;
}

void addUnique(int x)
{
  for(ic=0;ic<uc;ic++)
    {
      if (unique[ic] == x) return;
    }
  unique[uc++] = x;
}

int testUnique(int x)
{
  int ret = 1;
  if (x == 0) return ret;
  for(ic=0;ic<uc;ic++)
    {
      if (unique[ic] == x)
	{
	  ret = 0;
	}
    }
  return ret;
}

static int final[5];
static int last[5];
static int state;
#define OLDDATA    2
#define CHANGED    3
#define STABLE1    4
#define STABLE2    5
/*
 * If data changes we get ready to write new data files.
 * But only after the data has settled down 
 * (three identical readings)
 */
int newdata(void)
{
  if (once) return 1;
  int i;
  //  printf("STATE %d (%d,%d,%d,%d,%d)\n",state,
  //	 final[0],final[1],final[2],final[3],final[4]);

  for(i=0;i<5;i++)
    {
      if (last[i] != final[i])
	{
	  for(i=0;i<5;i++) last[i] = final[i];
	  state = CHANGED;
	  return 0;
	}
    }
    if (state != OLDDATA && ++state > STABLE1)
      {
	state = OLDDATA; return 1;
      }
  return 0;
}

void initWP();
void writeStatistics();
void writeWP();
void addWP(char *str);

void showscanline(char *label,struct line *a)
{
  printf(label);
  while(a)
    {
      printf(" %x [i %d t %d s %d e %d ] ", a, a->id, a->top, a->start, a->end);
      a = a->next;
    }
}

/******************************************************/

/* checkObject will see if the blob is the right size */
/* Add minHeight/Width to further constrain shapes    */

static int minSize;
static int maxSize;
static int minDim;
static int maxDim;
static int maxAspect;

int checkObject(int id, int line, int top, int width, int start)
{
  const char *reason;
  int status = 0;
  int height = (line - top);
  int size   = height * width;
  int xpos   = start+(width/2);
  int ypos   = (line+top)/2;

#ifdef DEBUG
  printf("Check Object %d\n",gMem);
  printf("line = %d top = %d  width = %d\n",line, top, width);
  printf("height = %d\n",height);
  printf("size = %d\n",size);
#endif

  if (size > gBlotsize)
    {
      gBlank = 1;
#ifdef DEBUG
      fprintf(stderr,"   %d:HUGE OBJECT(%d X %d = %d), assume area is empty\n",
	      id, width, height, size);
#endif
      return;          /* BLANK AREA, BAIL OUT HERE */
    } 

  if (width > minDim && width < maxDim)
    {
#ifdef DEBUG
      printf("width okay\n");
#endif
      if (height > minDim && height < maxDim)
	{
#ifdef DEBUG
	  printf("height okay\n");
#endif
	  if (size > minSize && size < maxSize)
	    {
#ifdef DEBUG
	      printf("size okay\n");
#endif
	      if (abs(width-height)<maxAspect)
		{
#ifdef DEBUG
		  printf("aspect okay\n");
#endif
		  if (testUnique(id))
		    {
#ifdef DEBUG
		      printf("OBJECT!(%d,%d)(%d,%d)\n",xpos,ypos,width,height);
#endif
		      objects++;
		      status = 1;
		      addUnique(id);
#ifdef DEBUG
		      gMem++;
#endif
		      return status;  /* COUNTED AN OBJECT, BAIL OUT HERE */
 /* 		     
  * BEYOND THIS POINT WE ARE SIMPLY FIGURING OUT
  * WHY THE THING DOESN'T COUNT AS AN OBJECT
  */
		    }
		  else { reason = "already counted"; gReject[1]++; }
		}
	      else { reason = "strange aspect ratio"; gReject[2]++; }
	    }
	  else
	    {
	      reason = "wrong area";
	      /* Small objects are speckles, large objects are errors */
	      if (size > maxSize)
		{
		  gReject[3]++;
		}
	      else
		{
		  gReject[0]--; /* size < minSize */
		}
	    }
	}
      else
	{
	  reason = "wrong height";
	  /* Small objects are speckles, large objects are errors */
	  if (height > maxDim)
	    {
	      gReject[4]++;
	    } 
	  else
	    {
	      gReject[0]--;
	    }
	}
    }
  else
    {
      reason = "wrong width";
      /* Small objects are speckles, large objects are errors */
      if (width > maxDim)
	{
	  gReject[5]++;
	} 
      else
	{
	  gReject[0]--;
	}
    }

  gReject[0]++; /* All Reasons (speckles already subtracted)*/

#ifdef DEBUG
  if (line-top != 0 && width != 0)
    {
      printf("%d: rejected(%s)(%d,%d) %d X %d object at %d on line %d\n",
    	 id, reason, xpos, ypos, (line-top),width,start,line);
    }
#endif


  return status;
}

void initializeGlobals(void)
{
  int i;
  for (i=0;i<5;i++)
    {
      last[i] = -1;
      gNoiseStr[i] = (char *)malloc(128);
    }

 gid     = 10;  /* Start global object ids at 10 */
 objects = 0;
 minSize = 100;  /* 14-26 worked for one example */
 maxSize = 2000; /* Total area cannot be larger than this */
 minDim  = 8;   /* Add minHeight/Width to further constrain shapes */
 maxDim  = 60;   /* Add minHeight/Width to further constrain shapes */
 maxAspect  = 24;  /* Aspect ratio out of this range is suspect */
 gMem = 10;
 gBlank = 0;
 gBlotsize = 80000;
 once = 0;

 /*
 gid     = 10;  
 objects = 0;
 minSize = 17;  
 maxSize = 121; 
 minDim  = 2;   
 maxDim  = 18;  
 */
}
int show = 0;
int main(int argc, char * argv[])
{
  initializeGlobals();
  signal(SIGSEGV, handler);
  signal(SIGINT,  inthandler);
  setbuf(stdout,NULL);

  if (argc > 1 && !strcmp(argv[1],"once"))
    {
      once = 1;
    }
  if (argc > 1 && !strcmp(argv[1],"show"))
    {
      if (argv[2]) show = atoi(argv[2]);
      else         show = 1;
      once = 1;
    }

 int x,y,w,h;

 int xcount = 5;     /* FIVE PANELS */
 int ycount = 1;
 int offsetx = 70;  /* LOCATE THE FIRST PANEL */
 int offsety = 120;
 int ydim = 180;        /* EACH IS 10.5" X 4.5" */
 int xdim = 45*ydim/105;
 
 /*
 int xcount = 5;
 int ycount = 1;
 int offsetx = 130;
 int offsety = 110;
 int ydim = 100;   
 int xdim = 45*ydim/105;
 */
 croplayout(".magnetrc", 5);

#ifdef DEBUG
 for(x=0;x<5;x++) {
   printf("cropcmd(%d,%d,%d,%d)\n", *(gXStart+x), *(gYStart+x), *(gWidth+x), *(gHeight+x) );
 }
#endif

 char tmp[1024];

 char remove[1024] =
   "C:/cygwin/bin/rm.exe -f fcam.jpg";
 char move[1024] =
   "C:/cygwin/bin/mv.exe -f C:/Apache2/htdocs/fcam.jpg fcam.jpg";
 char copy[1024] =
   "C:/cygwin/bin/cp.exe -f C:/Apache2/htdocs/fcam.jpg fcam.jpg";
 char chmod[1024] =
   "C:/cygwin/bin/chmod.exe 777 fcam.jpg";
 char review[1024] =
   "C:/cygwin/bin/cp.exe -f tmp.bmp C:/Apache2/htdocs/tmp.bmp";

 while(1)
   {
	 printf("fresh picture\n");

/*  WAIT FOR NEW fcam.jpg file to appear */
	 while(!exists("C:\\Apache2\\htdocs\\fcam.jpg"))
	   {
	     Sleep(500);
	     printf("waiting for image\n");
	   }
//	 system(move);
	 system(copy);

//     system(chmod);
//     }
     initWP();

     /* NO-CROP VERSION */

          sprintf(cmd, "%s %s /gray /silent /bpp=8 /contrast=100 /bright=-11 /convert=tmp.bmp", iview, "fcam.jpg"); 

	  /*     sprintf(cmd, "%s %s /gray /silent /bpp=8 /contrast=80 /bright=-1 /convert=tmp.bmp", iview, "fcam.jpg"); */


	  /* CROP VERSION */
	  /* sprintf(cmd, "%s %s /crop=\\(%d,%d,%d,%d\\) /gray /bpp=8 /contrast=124 /bright=-11 /convert=tmp.bmp", iview, "fcam.jpg", tXStart, tYStart, tWidth, tHeight+4);  */

     system(cmd);
     if (once) { system(review); }
     loadImage("tmp.bmp");
     printf("loaded\n");
     gMem = 90000;

 int j;

 for (x=0;x<xcount;x++)
   {
     gMem++;
     for (j=0; j<10; j++) gNoise[j] = 0;
     for(y=0;y<ycount;y++)
       {
	 sprintf(tmp,"<td align=center><img src=\"%s\" width=\"110\">\n",thisfile);
	 addWP(tmp);
         for (j=0; j<10; j++) gReject[j] = 0;

	 gTotalBlack = 0;
	 gBlank = 0;
	 checkImageN(x);
	 processBlock(x);

	 gReject[0] -= gReject[1]; /* "Already Counted" isn't an error */

//	 printf("TOTALBLACK(%d) = %d BLANK(%d)\n", x, gTotalBlack,gBlank);

	 if (gTotalBlack > 60000 || gBlank)
	   {
	    fprintf(stderr, "TotalBlack condition %d\n", gTotalBlack);
	    final[x] = 0;
	    sprintf(tmp,"<br><font weight=bold size=\"+4\">TB0</font></td>\n",0);
	   }
	 else  /* Consider other rejection criteria */
	   {
	     if (gReject[5] > 30) {
	       sprintf(tmp,"<br><font weight=bold size=\"+4\">E%d</font></td>\n",
		       objects);
	     }
	     else if (gReject[0] > 100)
	       {
		 sprintf(tmp,"<br>aspect(%d) area(%d) height(%d) width(%d)</td>\n",
			 gReject[2], gReject[3], gReject[4],gReject[5]);
	       }
	     else
	       {
		 sprintf(tmp,"<br><font weight=bold size=\"+4\">%d</font></td>\n",
			 objects);
		 final[x] = objects;
/*
		 int ti;
		 for (ti=0;ti<xcount;ti++) { printf("%d ", final[ti]);}
		 printf("\n");
*/

	       }
	   }
	 addWP(tmp);

     /* Accumulate Stats for this panel */
	 for(j=0;j<10;j++) gNoise[j] += gReject[j];
       }
     sprintf(gNoiseStr[x], "%3d, %3d, %3d, %3d, %3d, %3d",
	     gNoise[0],gNoise[1],gNoise[2],
	     gNoise[3],gNoise[4], gNoise[5] );
     for(j=0;j<10;j++) gNoise[j] = 0;

   }
 if (newdata())
   {
     int g;
     for (g=0;g<5;g++)
       printf("%d [%s]\n",final[g],gNoiseStr[g]);
     printf("-------------------------\n");
     addWP("<td><img src=\"fcam.jpg\" width=\"320\"></td></tr></table>\n");
     /* Write out the vars.html file with values */
     writeStatistics();
     addWP("<hr>\n<img src=\"tmp.bmp\" width=800>\n");
     writeWP();
   }
 else
   {
     writeStatistics();
   }
  
 if (once) { exit(0); } /* FOR UNIT TESTING */

   } /* LOOP FOREVER */
 return 0;
} /* end of main */

static int prev = 0;
static int totaldisks = 0;
static int hpos;
static char ghtml[4096];

void initWP()
{
  hpos = 0;
  addWP("<html>\n");
  addWP("<TITLE>Video Spot Counter</TITLE>\n");
  addWP("<META HTTP-EQUIV=\"refresh\" CONTENT=\"1\">\n");
  addWP("<body><center>\n<h1>Spot Counter/Alignment</h1>");
  addWP("<table border=8 cellpadding=8><tr>\n");
  addWP("<th colspan=5>Spot Counter Output</th>");
  addWP("<th>Original Image</th></tr>\n<tr>\n");
}
/*
 * We need to write the new file all at once so we
 * don't have contention with the page-update from
 * the browser.
 */
void writeWP()
{
  /* system("C:/cygwin/bin/rm.exe /cygdrive/c/Apache2/htdocs/magnets.html"); */
  FILE *fp = fopen("/cygdrive/c/Apache2/htdocs/magnets.html","w");
  if (fp == NULL)
    {
      printf("Could not open magnets.html on Info server\n");
      exit(0);
    }
  else
    {
      fwrite(ghtml,1,hpos,fp);
      fprintf(fp, "</body>\n</html>\n");
      fclose(fp);
   } 
}

/*
 * Writes out the vars.html file with values
 */

void writeStatistics()
{
  int hs = exists("C:\\Apache2\\cgi-bin\\hold");
  if (hs)
    {
      printf("Not writing vars.html file (exists(hold) returned %d\n",hs);
      return;
    }
  else
    {
      printf("Updating vars.html file (exists(hold) returned null\n");
    }
  char *bar =
    "C:/cygwin/bin/touch.exe /cygdrive/c/Apache2/htdocs/birds/barchart.html";
  char *pie =
    "C:/cygwin/bin/touch.exe /cygdrive/c/Apache2/htdocs/birds/piechart.html";

  unlink("/cygdrive/c/Apache2/htdocs/birds/vars.js");
  FILE *fp = fopen("/cygdrive/c/Apache2/htdocs/birds/vars.js","w");
  if (fp == NULL)
    {
      printf("Could not open vars.html on Web server\n");
    }
  else
    {
      fprintf(fp, "[%d, %d, %d, %d, %d]\n",
	      final[0],final[1],final[2],final[3],final[4]);
      fclose(fp);
   } 
  system(bar);
  system(pie);
  //  printf("touched HTML files\n");
}

void addWP(char *str)
{
  int len = strlen(str);
  if (len + hpos < 4094)
    {
      strcpy(&ghtml[hpos],str);
      hpos += len;
    }
  else
    {
      printf("Out of space for HTML page, increase ghtml array\n");
      exit(0);
    }
}
