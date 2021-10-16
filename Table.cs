using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ORM
{
    public class Table
    {
        public string Name { get; set; }
        public List<Column> Columns { get; set; }

        
    }
}
