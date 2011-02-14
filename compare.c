#include <windows.h>
#include <stdio.h>
#include "line.h"

  /* COMPARE TWO SCANLINES, COUNT OBJECTS, FREE SCANLINE "a" */

struct line *comparelines(int scanline, struct line *a, struct line *b)
{
  struct line *heada = a;
  struct line *headb = b;
  struct line *tmp;

#define OVERLAP(m,n)	(!(a->end<b->start)||(a->start>b->end))

#ifdef DEBUG
   if (a && b)
     {
       printf("%d: ",scanline);
       showscanline("B",b);
       showscanline("A",a);
       printf("\n"); 
     }
#endif

   if (!b || (b && !b->top)) /* Scanline B is completely white */
     {
       //       printf("b is empty\n");
       /* All unique objects in a should be counted */
       while(a)
	{
	  checkObject(a->id, scanline, a->top, a->maxlen,a->start);
	  a = a->next;
	 }
     }
   else
     {
       while(a && b && a->top)
	 {
#ifdef DEBUG
	   printf("[%x    %x]\n", a, b);
#endif
	   if (a->end < b->start)      /* A before B */
	     {
	       //	       printf("A before B\n");
	       /* Object ended on scanline A */
	       if (checkObject(a->id, scanline, a->top, a->maxlen,a->start))
		 {
		   int tmpid = a->id;
		   struct line *good = a;
		   a = a->next;
		   while(a && (a->id == tmpid))
		     {
		       tmp = a;
		       a = a->next;
		       //		       printf("Freeing 4 %x\n",tmp);
		       free(tmp);
		     }
		   good->next = a;
		 }
	       else
		 {
		   if (a)
		     {
		       a = a->next;
		     }
		 }
	     }
	   else if (a->start > b->end) /* A after B */
	     {
	       b = b->next;
	     }
	   else   /* Overlapping, so merge them */
	     {
#ifdef DEBUG
	       printf("Merge A(%d,%d) B(%d,%d)\n",
		      a->start + a->maxlen/2,
		      (scanline+a->top)/2,
		      b->start + b->maxlen/2,
		      (scanline+b->top)/2);
#endif

	       int aend = a->end;
	       int bend = b->end;
	       merge(a,b);
	       if (bend < aend)
		 {
#ifdef DEBUG
		   printf("moving along B(%d)\n",b->id);
#endif
		   b = b->next;
		 }
	       else
		 {
#ifdef DEBUG
		   printf("moving along A(%d)\n",a->id);
#endif
		   a = a->next;
		 }
#ifdef DEBUG
	       printf("after Merge B(%x) A(%x)",b,a);
#endif
	     }
	 }
       //Now maybe B has run out and we need to look for some trailing A's
       // Like above where we considered the remaining A's
#ifdef DEBUG
       if (a)
	 {
	   showscanline("XtraA",a);
	 }
       printf("after showscanline(A)\n");
#endif
       while(b && a && (b->end < a->start))
	 {
	   b = b->next;
	 }
#ifdef DEBUG
       printf("after passing Bs\n");
#endif
       if (!b && a)
	 {
#ifdef DEBUG
	   printf("EXTRACheck A (%d)\n",a->id);
#endif
	   while(a)
	     {
#ifdef DEBUG
	       printf("CHECK(%d)\n",a->id);
#endif
	       checkObject(a->id, scanline, a->top, a->maxlen,a->start);
	       a = a->next;
	     }
	 }
#ifdef DEBUG
       printf("after FINAL A check\n");
#endif
     } /* END ELSE */

#ifdef DEBUG
   printf("Cleanup A\n");
#endif
   a = heada;
#ifdef DEBUG
   showscanline("Cleanup",a);
#endif
   while (a)
     {
       tmp = a;
       a = a->next;
       free(tmp);
     }
#ifdef DEBUG
   printf("Cleanup B?\n");
#endif
   b = headb;
   if (b && !b->top) /* Nothing in the new scan line */
     {
       free(b);
       b = (struct line *)NULL;
     }
#ifdef DEBUG
 printf("Returning %d: ",scanline);
 showscanline("B",b);
 printf("\n"); 
#endif
   return(b);
}


/* 
 * Merge two objects, with the idea that line "a" will
 * be going away soon and "b" will persist
 */

void merge(struct line *a, struct line *b)
{
  int newlength = (a->maxlen > b->maxlen)? a->maxlen : b->maxlen;
  int newstart = (a->start < b->start) ? a->start : b->start;
  int newend  = (a->end > b->end) ? a->end : b->end;

  a->maxlen = b->maxlen = newlength;
  a->start  = b->start  = newstart;
  a->end    = b->end    = newend;
  b->top    = a->top;

  if (b->id)
    {
      a->id = b->id;
    }
  else
    {
      if (!a->id)
	{
	  a->id = gid++;  /* Need a new Unique ID */
	}
      b->id = a->id;
    }
#ifdef DEBUG
  printf("ID %d\n",a->id);
#endif
}




