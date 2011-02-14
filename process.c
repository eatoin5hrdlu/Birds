#include <windows.h>
#include <stdio.h>
#include "line.h"


void processBlock(int n)
{
  struct line *a;
  struct line *b;
  int scanline;

  objects = 0;
  resetUnique();

  char *data = newgetaline(*(gYStart+n), *(gXStart+n));
  a = scan(data, 0, *(gWidth+n));

  //  printf("BLOCK(%d,%d,%d,%d)\n",
  //     *(gXStart+n), *(gYStart+n), *(gWidth+n),*(gHeight+n));

  for(scanline=1; scanline < *(gHeight+n)-1; scanline++)
    {
      data = newgetaline(*(gYStart+n)+scanline, *(gXStart+n));
      b = scan(data, scanline, *(gWidth+n));
      if (a) 
	{
	  a = comparelines(scanline, a, b);
	}
      else
	{
	  a = b;
	}
    }
  //  fprintf(stderr, "%d objects in block %d\n", objects, n+1);
}


struct line *scan(char *data, int scanline, int width)
{
  int black = 0;
  struct line *l = (struct line *)malloc(sizeof(struct line));
  struct line *a = l;
  struct line *last = l;
  a->id = a->top  = a->start = a->end = a->maxlen = 0;
  a->next = (struct line *)NULL;

  int nw, nb;
  nw = nb = 0;

  unsigned int w;
  gMem = 120000;
  for(w=1;w<width-1;w++)  /* avoid the edges */
    {
      gMem = 1;
      if (data[w])  /* BLACK */
	{
	  gMem = 2;
	  if (!black && !data[w+1])
	     {
	       w++;
	       continue; /* Ignore one pixel of black */
	     }
	   nb++;
	   black = 1;
	   if (!a->top)
	     {
	       a->top = scanline;
	       a->start = w; /* (w?w-1:w); */
	     }
	 } /* black bit */
      else
	{  /* white bit */
	  gMem = 3;
	  if (black)
	     {
	       gMem = 4;
	       if (data[w+1]) /* Ignore one pixel of white! */
		 {
		   w++;
		   continue;
		 }
	       black = 0;
	       if (a->start != w-1) /* 1-BIT SPECKLE */
		 {
		   gMem = 5;
		   if (a->top || scanline==0)
		     {
		       last = a;
		       a->end = w+1;
		       /* PICKS UP SPECKLES!  a->end = w+1; */ 
		       a->maxlen = a->end - a->start;
 //		       printf("a length = %d\n", a->maxlen);
		       a->next = (struct line *)malloc(sizeof(struct line));
		       a = a->next;
		       //		       printf("malloc %x\n",a);
		       a->id = a->top = a->start = a->end = a->maxlen = 0;
		       a->next = (struct line *)NULL;
		     }
		 }
	     }
	  nw++;
	} /* white bit */
    }  /* for w=0..width */

/* NEW */
  if (black) /* INSIDE OBJECT AT THE END OF THE LINE */
    {
#ifdef DEBUG
      printf("Inside object at the end of the line\n");
#endif
      if (a->start != w-1) /* 1-BIT SPECKLE */
	{
	  if (a->top || scanline==0)
	    {
	      last = a;
	      a->end = w+1;
	      a->maxlen = a->end - a->start;
	      a->next = (struct line *)malloc(sizeof(struct line));
	      a = a->next;
	      a->id = a->top = a->start = a->end = a->maxlen = 0;
	      a->next = (struct line *)NULL;
	    }
	}
    }
/* NEWEND */

//   fprintf(flog,"Adding %d to TotalBlack(%d)\n", nb, gTotalBlack);
   gTotalBlack += nb;

   if (a && black)
     {
       a->end = w;
       a->maxlen = a->end - a->start;
     }

   if (last->next)
     {
       //       printf("Freeing %x\n",last->next);
       free(last->next);
       last->next = (struct line *)NULL;
     }
   return l;
}

