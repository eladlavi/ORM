using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ORM
{
    public class Column
    {
        public string Name { get; set; }
        public int OrdinalPosition { get; set; }
        public string DataType { get; set; }
        public string DefaultValue { get; set; }
        public bool IsNullable { get; set; }
        public int CharacterLength { get; set; }
        public string ForeginKeyTable { get; set; }


    }
}
